/* =============================================
   BARBERPRO — script.js
   ============================================= */

// ============================================================
// GRÁFICO SEMANAL
// ============================================================
const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const vals = [620, 480, 710, 550, 840, 980, 784];
const mx   = Math.max(...vals);

const cb = document.getElementById('cbar');
const cl = document.getElementById('clbl');

dias.forEach((d, i) => {
  const h = Math.round((vals[i] / mx) * 94);
  cb.innerHTML += `
    <div class="cwrap">
      <div class="cb${i === 6 ? ' today' : ''}"
           style="height:${h}px"
           title="R$${vals[i]}"
           onclick="toast('${d}: R$${vals[i]}')">
      </div>
    </div>`;
  cl.innerHTML += `
    <div style="flex:1;text-align:center;font-size:10px;color:${i === 6 ? 'var(--gold)' : 'var(--muted)'}">
      ${d}
    </div>`;
});

// ============================================================
// NAVEGAÇÃO
// ============================================================
function go(p, el) {
  document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
  document.getElementById('p-' + p).classList.add('active');
  if (el) el.classList.add('active');
  const titulos = {
    dashboard:  'DASHBOARD',
    fila:       'FILA DE ESPERA',
    agenda:     'AGENDAMENTOS',
    barbeiros:  'BARBEIROS',
    relatorios: 'RELATÓRIOS',
    servicos:   'SERVIÇOS',
    permissoes: 'PERMISSÕES',
    whatsapp:   'WHATSAPP BOT'
  };
  document.getElementById('ptitle').textContent = titulos[p] || p.toUpperCase();
}

// ============================================================
// ALTERNAR PERFIL (Dono / Cliente)
// ============================================================
function perfil(p) {
  if (p === 'cliente') {
    toast('Agora você está vendo como CLIENTE — só Fila e Agendamento visíveis');
    document.querySelectorAll('.nav-sec').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(item => {
      const txt = item.textContent.trim();
      item.style.display = (txt.includes('Fila') || txt.includes('Agendamentos')) ? 'flex' : 'none';
    });
    go('fila', null);
  } else {
    toast('Agora você está vendo como DONO — acesso total');
    document.querySelectorAll('.nav-sec').forEach(s => s.style.display = '');
    document.querySelectorAll('.nav-item').forEach(item => item.style.display = 'flex');
    const primeiro = document.querySelectorAll('.nav-item')[0];
    go('dashboard', primeiro);
    primeiro.classList.add('active');
  }
}

// ============================================================
// FILA DE ESPERA
// ============================================================
let fc = 6;

function addFila() {
  const n = prompt('Nome do cliente:');
  if (!n) return;
  fc++;
  document.getElementById('f-total').textContent = fc;
  document.getElementById('d-fila').textContent  = fc;
  document.getElementById('nb-fila').textContent = fc;

  const lista = document.getElementById('f-lista');
  const div   = document.createElement('div');
  div.className = 'fi';
  div.innerHTML = `
    <div class="fpos">${fc}</div>
    <div class="finfo">
      <div class="fname">${n}</div>
      <div class="fdet">Aguardando · agora</div>
    </div>
    <span style="font-size:11px;color:var(--muted);margin-right:8px">≈${fc * 9}min</span>
    <span class="badge bm">Na fila</span>`;
  lista.appendChild(div);
  toast(`${n} entrou na fila (#${fc}) · WhatsApp enviado!`);
}

function concluir(btn, n) {
  const item = btn.closest('.fi');
  item.style.opacity    = '0';
  item.style.transition = 'opacity .3s';
  setTimeout(() => {
    item.remove();
    fc = Math.max(0, fc - 1);
    document.getElementById('f-total').textContent = fc;
    document.getElementById('d-fila').textContent  = fc;
    document.getElementById('nb-fila').textContent = fc;
  }, 300);
  toast(`${n} concluído! Avaliação enviada via WhatsApp.`);
}

// ============================================================
// AGENDA
// ============================================================
function ssel(el) {
  document.querySelectorAll('.so').forEach(s => s.classList.remove('sel'));
  el.classList.add('sel');
}

function stab(el) {
  el.parentNode.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function confirmarAg() {
  const n = document.getElementById('ag-nome').value.trim();
  if (!n) { toast('Preencha o nome do cliente!'); return; }
  const sl = document.getElementById('slot-livre');
  if (sl) {
    const div = document.createElement('div');
    div.className = 'ag bk';
    div.innerHTML = `
      <span class="ah">16:00</span>
      <span style="flex:1;font-weight:500">${n}</span>
      <span style="color:var(--muted);font-size:11px">Corte · Qualquer</span>
      <span class="badge bb">Confirmado</span>`;
    sl.replaceWith(div);
  }
  document.getElementById('ag-nome').value = '';
  toast(`Agendado para ${n}! Confirmação enviada no WhatsApp.`);
}

// ============================================================
// RELATÓRIOS — DOWNLOAD CSV REAL
// ============================================================
function exp(tipo) {
  const d = new Date().toLocaleDateString('pt-BR');
  let csv = '', nome = '';

  if (tipo.includes('barbeiro') || tipo === 'completo') {
    nome = 'relatorio_barbeiros_marco2026';
    csv  = 'Barbeiro,Atendimentos,Faturamento,Comissao40pct\n'
         + 'Lucas Carvalho,52,1820,728\n'
         + 'Joao Oliveira,61,2135,854\n'
         + 'Pedro Souza,44,1540,616\n'
         + 'TOTAL,157,5495,2198\n'
         + 'Gerado em:,' + d + '\n';
  } else if (tipo.includes('diario')) {
    nome = 'faturamento_diario_marco2026';
    csv  = 'Data,Clientes,Faturamento\n'
         + '13/03/2026,23,784\n'
         + '12/03/2026,21,720\n'
         + '11/03/2026,19,650\n'
         + '10/03/2026,18,612\n'
         + '09/03/2026,22,748\n'
         + 'Gerado em:,' + d + '\n';
  } else if (tipo.includes('servicos')) {
    nome = 'servicos_vendidos_marco2026';
    csv  = 'Servico,Quantidade,Receita\n'
         + 'Corte,130,3900\n'
         + 'Barba,63,1575\n'
         + 'Combo,40,2000\n'
         + 'Hidratacao,18,720\n'
         + 'Coloracao,12,960\n'
         + 'TOTAL,263,9155\n'
         + 'Gerado em:,' + d + '\n';
  } else {
    nome = 'historico_clientes_marco2026';
    csv  = 'Cliente,Visitas,Total Pago\n'
         + 'Carlos Mendes,8,320\n'
         + 'Ricardo Alves,5,175\n'
         + 'Marcos Lima,3,75\n'
         + 'Felipe Santos,6,180\n'
         + 'Gerado em:,' + d + '\n';
  }

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = nome + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast(`${nome}.csv baixado! Abra no Excel.`);
}

// ============================================================
// PERMISSÕES — TOGGLES
// ============================================================
function tog(el) {
  const ligado = el.classList.contains('on');
  el.classList.toggle('on',  !ligado);
  el.classList.toggle('off',  ligado);
  toast(ligado ? 'Permissão desativada' : 'Permissão ativada');
}

// ============================================================
// LINK DO SITE (WhatsApp Bot)
// ============================================================
function salvarLink() {
  const v = document.getElementById('link-in').value.trim();
  if (!v) { toast('Digite o link!'); return; }
  CONFIG.LINK = v;
  toast('Link salvo: ' + v);
}

// ============================================================
// BOT WHATSAPP — SIMULAÇÃO
// ============================================================
function menuMsg() {
  return `Olá! 👋 Bem-vindo à *BarberPro*! 💈\n\nEscolha uma opção:\n\n1️⃣ Agendar horário\n2️⃣ Ver minha fila\n3️⃣ Ver barbeiros disponíveis\n4️⃣ Cancelar agendamento\n5️⃣ Falar com atendente\n\n_Responda com o número_`;
}

const bot = {
  'oi':        menuMsg,
  'olá':       menuMsg,
  'ola':       menuMsg,
  'bom dia':   menuMsg,
  'boa tarde': menuMsg,
  'boa noite': menuMsg,
  'menu':      menuMsg,
  'ajuda':     menuMsg,
  'hello':     menuMsg,

  '1': () => `📅 *Agendar Horário*\n\nAcesse nosso site para escolher barbeiro, serviço e horário:\n👉 ${CONFIG.LINK}\n\nQualquer dúvida é só falar! 😊`,

  '2': () => `📊 *Sua posição na fila:*\n\n🔢 Posição: *3*\n⏱ Tempo estimado: *≈ 28 minutos*\n👨 Barbeiro: Lucas\n✂ Serviço: Corte\n\nVocê será avisado aqui quando for sua vez! 🔔`,

  '3': () => `👨 *Barbeiros disponíveis agora:*\n\n🟢 Lucas — Disponível\n🔴 João — Ocupado (≈12min)\n🔴 Pedro — Ocupado (≈8min)\n\nPara agendar:\n👉 ${CONFIG.LINK}`,

  '4': () => `❓ *Cancelar agendamento*\n\nSeu próximo agendamento:\n📅 Hoje às 15:00 com Lucas · Corte\n\nConfirma o cancelamento?\n✅ Responda *SIM* para cancelar\n❌ Responda *NÃO* para manter`,

  '5': () => `💬 *Atendente Humano*\n\nUm atendente vai te responder em breve!\n\nHorário de atendimento:\nSeg–Sex: 8h às 20h\nSábado: 8h às 18h\n\nAguarde! 😊`,

  'sim': () => `❌ *Agendamento cancelado!*\n\nCancelado com sucesso.\n\nPara remarcar:\n👉 ${CONFIG.LINK}\n\nEsperamos você em breve! 💈`,

  'nao':  () => `✅ Ok! Agendamento *mantido*.\n\nTe esperamos! 💈`,
  'não':  () => `✅ Ok! Agendamento *mantido*.\n\nTe esperamos! 💈`,
};

function waSend() {
  const inp  = document.getElementById('wa-in');
  const txt  = inp.value.trim();
  if (!txt) return;

  const chat = document.getElementById('wa-chat');

  // mensagem enviada
  chat.innerHTML += `<div class="wmsg sent">${txt}<div class="wtime">agora ✓✓</div></div>`;
  inp.value = '';
  chat.scrollTop = 99999;

  // animação de digitando
  const typing = document.createElement('div');
  typing.className = 'wmsg recv';
  typing.innerHTML = '<div class="td-wrap"><div class="td"></div><div class="td"></div><div class="td"></div></div>';
  chat.appendChild(typing);
  chat.scrollTop = 99999;

  setTimeout(() => {
    typing.remove();
    const fn   = bot[txt.toLowerCase().trim()];
    const resp = fn
      ? fn()
      : `Não entendi 😅\n\nDigite *menu* para ver as opções ou acesse:\n👉 ${CONFIG.LINK}`;
    const html = resp
      .replace(/\n/g, '<br>')
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    chat.innerHTML += `<div class="wmsg recv">${html}<div class="wtime">agora ✓✓</div></div>`;
    chat.scrollTop = 99999;
  }, 1000);
}

// ============================================================
// TOAST
// ============================================================
let toastTimer;

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}
