// =======================
// FIREBASE
// =======================
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO.firebaseapp.com",
  databaseURL: "https://SEU_DOMINIO.firebaseio.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// =======================
// MAPA
// =======================
const map = L.map('map').setView([-13.059, -55.904], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let markers = {};
let routingControl = null;

// =======================
// TOAST
// =======================
function showToast(msg, type='success', time=3000){
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  toast.style.display = 'block';
  setTimeout(()=>{ toast.style.display='none'; }, time);
}

// helper de formatação
const fmtBR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// =======================
// GEOCODING
// =======================
async function getCoords(endereco){
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`);
  const data = await res.json();
  if(!data[0]) throw new Error("Endereço não encontrado");
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

// =======================
// ROTAS
// =======================
let rotasSalvas = {};
function preencherRotaComFornecedor(fornecedorId){
  const rota = rotasSalvas[fornecedorId] || {};
  document.getElementById('destino').value = rota.destino || '';
  document.getElementById('origem').value = rota.origem || 'São Paulo';
  document.getElementById('precoCombustivel').value = rota.precoCombustivel || '';
  document.getElementById('consumoCarro').value = rota.consumoCarro || '';
  document.getElementById('pedagio').value = rota.pedagio || '';
  calcularRota();
}

// =======================
// ATUALIZAR FORNECEDORES
// =======================
function atualizarSelectFornecedores() {
  const select = document.getElementById('fornecedorSelect');
  const cardsContainer = document.getElementById('fornecedoresCards');
  select.innerHTML = '<option value="">Selecione o fornecedor</option>';
  cardsContainer.innerHTML = '';

  database.ref('fornecedores').once('value', snapshot => {
    snapshot.forEach(fSnap => adicionarFornecedorUI(fSnap.key, fSnap.val()));
  });
  database.ref('fornecedores').on('child_added', fSnap => {
    if(!markers[fSnap.key]) adicionarFornecedorUI(fSnap.key, fSnap.val());
  });
  database.ref('fornecedores').on('child_removed', fSnap => {
    const card = document.getElementById(`card-${fSnap.key}`);
    if(card) card.remove();
    const option = select.querySelector(`option[value="${fSnap.key}"]`);
    if(option) option.remove();
    if(markers[fSnap.key]){
      map.removeLayer(markers[fSnap.key]);
      delete markers[fSnap.key];
    }
    delete rotasSalvas[fSnap.key];
  });
}

// =======================
// ADICIONAR FORNECEDOR NA UI
// =======================
async function adicionarFornecedorUI(key, f){
  const select = document.getElementById('fornecedorSelect');
  const cardsContainer = document.getElementById('fornecedoresCards');

  if(!select.querySelector(`option[value="${key}"]`)){
    const option = document.createElement('option');
    option.value = key;
    option.textContent = f.nome;
    select.appendChild(option);
  }

  if(!document.getElementById(`card-${key}`)){
    const card = document.createElement('div');
    card.classList.add('card-fornecedor');
    card.id = `card-${key}`;
    
    let produtosHTML = '';
    if(f.produtos && f.produtos.length){
      produtosHTML = '<ul>'+f.produtos.map(p=>`<li>${p.nome} - R$ ${p.preco.toFixed(2)} (${p.pagamento})</li>`).join('')+'</ul>';
    }

    card.innerHTML = `
      <h3><i class="fas fa-industry"></i> ${f.nome}</h3>
      <p><b>Endereço:</b> ${f.endereco}</p>
      <p><b>Estado:</b> ${f.estado}</p>
      <p><b>CNPJ:</b> ${f.cnpj}</p>
      ${produtosHTML}
      <button onclick="preencherRotaComFornecedor('${key}')"><i class="fas fa-map-marker-alt"></i> Rota</button>
      <button class="btn-excluir" onclick="removerFornecedor('${key}')"><i class="fas fa-trash"></i> Excluir</button>
    `;
    cardsContainer.appendChild(card);
  }

  if(!markers[key]){
    try{
      const [lat, lon] = await getCoords(f.endereco);
      const marker = L.marker([lat, lon]).addTo(map).bindPopup(`<b>${f.nome}</b><br>${f.endereco}`);
      markers[key] = marker;
    }catch(err){ console.warn("Erro ao geocodificar:", f.nome); }
  }
}

// =======================
// REMOVER FORNECEDOR
// =======================
function removerFornecedor(key){
  if(confirm("Tem certeza que deseja excluir este fornecedor?")){
    database.ref('fornecedores/' + key).remove();
    showToast("Fornecedor removido!", "success");
  }
}

// =======================
// CADASTRO FORNECEDOR
// =======================
document.getElementById('fornecedorForm').addEventListener('submit', e=>{
  e.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const cnpj = document.getElementById('cnpj').value.trim();
  const endereco = document.getElementById('endereco').value.trim();
  const estado = document.getElementById('estado').value.trim();
  if(!nome || !cnpj || !endereco || !estado){ 
    return showToast('Preencha todos os campos', 'error'); 
  }

  database.ref('fornecedores').push({nome, cnpj, endereco, estado})
    .then(()=>{ 
      document.getElementById('fornecedorForm').reset(); 
      showToast('Fornecedor cadastrado com sucesso', 'success'); 
    }).catch(()=> showToast('Erro ao cadastrar fornecedor', 'error'));
});

// =======================
// CADASTRO PRODUTO
// =======================
document.getElementById('produtoForm').addEventListener('submit', e=>{
  e.preventDefault();
  const fornecedorId = document.getElementById('fornecedorSelect').value;
  const nome = document.getElementById('produtoNome').value.trim();
  const preco = parseFloat(document.getElementById('produtoPreco').value.replace(',', '.'));
  const pagamento = document.getElementById('produtoPagamento').value.trim() || "Não informado";
  if(!fornecedorId) return showToast('Selecione um fornecedor', 'error');

  database.ref(`produtos/${fornecedorId}`).push({nome, preco, pagamento})
    .then(()=>{ 
      document.getElementById('produtoForm').reset(); 
      showToast('Produto cadastrado com sucesso!', 'success'); 
    });
});

// =======================
// CALCULAR ROTA (CORRIGIDO E COM VALIDAÇÃO)
// =======================
async function calcularRota(){
  const origem = document.getElementById('origem').value.trim();
  const destino = document.getElementById('destino').value.trim();

  // ler inputs e tratar separadores
  const precoCombustivelRaw = (document.getElementById('precoCombustivel').value || '').replace(',', '.').trim();
  const consumoCarroRaw = (document.getElementById('consumoCarro').value || '').replace(',', '.').trim();
  const pedagioRaw = (document.getElementById('pedagio').value || '').replace(',', '.').trim();

  const precoCombustivel = parseFloat(precoCombustivelRaw);
  const consumoCarro = parseFloat(consumoCarroRaw);
  const pedagio = parseFloat(pedagioRaw) || 0;

  if(!origem || !destino) return showToast('Preencha origem e destino', 'error');
  if(isNaN(precoCombustivel) || precoCombustivel <= 0) return showToast('Preço do combustível inválido', 'error');
  if(isNaN(consumoCarro) || consumoCarro <= 0) return showToast('Consumo do carro inválido (km por litro)', 'error');

  try{
    const coordOrigem = await getCoords(origem);
    const coordDestino = await getCoords(destino);

    if(routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
      waypoints: [L.latLng(coordOrigem[0], coordOrigem[1]), L.latLng(coordDestino[0], coordDestino[1])],
      routeWhileDragging: true,
      showAlternatives: false
    }).addTo(map);

    routingControl.on('routesfound', function(e) {
      const rota = e.routes && e.routes[0];
      if(!rota || !rota.summary) {
        showToast('Não foi possível obter a distância da rota', 'error');
        return;
      }

      const distanciaKm = rota.summary.totalDistance / 1000; // metros -> km
      const litrosNecessarios = distanciaKm / consumoCarro; // km / (km/l) = litros
      const custoCombustivel = litrosNecessarios * precoCombustivel;
      const custoTotal = custoCombustivel + pedagio;

      document.getElementById('resultadoRota').innerHTML = `
        <p><b>Distância aproximada:</b> ${distanciaKm.toFixed(2)} km</p>
        <p><b>Litros necessários:</b> ${litrosNecessarios.toFixed(2)} L</p>
        <p><b>Preço por litro:</b> ${fmtBR(precoCombustivel)}</p>
        <p><b>Custo combustível:</b> ${fmtBR(custoCombustivel)}</p>
        <p><b>Pedágio:</b> ${fmtBR(pedagio)}</p>
        <p><b>Custo total estimado:</b> ${fmtBR(custoTotal)}</p>
      `;
    });

  }catch(err){ 
    showToast('Erro ao calcular rota', 'error'); 
    console.error(err);
  }
}

// =======================
// EVENTOS ROTA
// =======================
document.getElementById('rotaForm').addEventListener('submit', e=>{
  e.preventDefault();
  calcularRota();
});

// =======================
// TEMA CLARO/ESCUR0
// =======================
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', ()=>{
  document.body.classList.toggle('light');
  themeToggle.innerHTML = document.body.classList.contains('light') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// =======================
// INICIALIZAÇÃO
// =======================
atualizarSelectFornecedores();
