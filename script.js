// Supabase config
const SUPABASE_URL = 'https://xopwqunmuuazzelvuvwt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcHdxdW5tdXVhenplbHZ1dnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDg3MjUsImV4cCI6MjA2NjI4NDcyNX0.773OOvJcwQGgw53YfZbx4mRNSmfXE4u2KkibpybJ28E';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Checar autenticação
supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    window.location.href = 'index.html';
  }
});

(function(){
      emailjs.init({
        publicKey: "yYjrTa1UFxHMyz0K6",
      });
})();

// Garantir que pedidos seja preenchido apenas via Supabase
let pedidos = [];
let emailsUsuarios = [];

async function carregarPedidos() {
  const { data, error } = await supabase.from('pedidos').select('*').order('dataCriacao', { ascending: true });
  if (!error) {
    pedidos = data.map(p => ({
      ...p,
      expira: new Date(p.expira),
      dataCriacao: new Date(p.dataCriacao)
    }));
    atualizarListas();
  } else {
    console.error('Erro ao carregar pedidos do Supabase:', error);
  }
}

function salvarPedidos() {
  // Remover funções carregarPedidos e salvarPedidos relacionadas ao localStorage
}

// Adicionar pedido
async function adicionarPedido() {
  const numero = document.getElementById("pedido").value.trim();
  const descricao = document.getElementById("descricao").value.trim();
  const expiraInput = document.getElementById("expiraEm").value;

  if (!numero || !descricao || !expiraInput) {
    document.getElementById("mensagem").textContent = "Preencha todos os campos!";
    return;
  }

  // Verificar se já existe um pedido com o mesmo número
  const { data: pedidoExistente } = await supabase.from('pedidos').select('id').eq('numero', numero).maybeSingle();
  if (pedidoExistente) {
    document.getElementById("mensagem").textContent = "Já existe um pedido com este número!";
    return;
  }

  const expira = new Date(expiraInput);
  const agora = new Date();

  if (expira <= agora) {
    document.getElementById("mensagem").textContent = "A data de expiração não pode ser no passado!";
    return;
  }

  if (isNaN(expira)) {
    document.getElementById("mensagem").textContent = "Data inválida!";
    return;
  }

  const dataCriacao = new Date();
  // Pega o telefone do usuário logado (do email fake)
  const user = await supabase.auth.getUser();
  const telefoneCriador = user.data.user.email.replace('@celular.mabila', '');
  await supabase.from('pedidos').insert({
    numero,
    descricao,
    expira: expira.toISOString(),
    status: "pendente",
    notificado: false,
    dataCriacao: dataCriacao.toISOString(),
    criador: telefoneCriador
  });
  document.getElementById("mensagem").textContent = "Pedido adicionado!";
  document.getElementById("pedido").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("expiraEm").value = "";
}

setTimeout(() => {
    document.getElementById("mensagem").textContent = "";
  }, 5000);

function cancelar() {
    let can = document.getElementById("cancelar")

  document.getElementById("pedido").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("expiraEm").value = "";
}

// Excluir pedido
async function excluirPedido(id) {
  if (confirm("Tem certeza que deseja excluir este pedido?")) {
    await supabase.from('pedidos').delete().eq('id', id);
  }
}

function atualizarListas() {
  const pendentes = document.getElementById("listaPendentes");
  const concluidos = document.getElementById("listaConcluidos");
  pendentes.innerHTML = "";
  concluidos.innerHTML = "";

  pedidos.forEach(pedido => {
    const li = document.createElement("li");

    if (pedido.status === "pendente") {
      li.innerHTML = `
        <div id="view-${pedido.id}">
          <strong>Número:</strong> ${pedido.numero}<br>
          <strong>Descrição:</strong> ${pedido.descricao}<br>
          <strong>Criado em:</strong> ${pedido.dataCriacao.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}<br>
          <strong>Expira em:</strong> ${pedido.expira.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}<br>
          <button id="editar" onclick="abrirEdicao(${pedido.id})">Editar</button>
          <button id="concluir" onclick="marcarComoConcluido(${pedido.id})">Concluir</button>
          <button onclick="excluirPedido(${pedido.id})" class="btn-excluir">Excluir</button>
        </div>
        <div id="edit-${pedido.id}" style="display: none;">
          <input value="${pedido.numero}" id="edit-num-${pedido.id}" />
          <input value="${pedido.descricao}" id="edit-desc-${pedido.id}" />
          <input type="datetime-local" value="${pedido.expira.toISOString().slice(0, 16)}" id="edit-exp-${pedido.id}" />
          <button onclick="salvarEdicao(${pedido.id})">Salvar</button>
          <button onclick="cancelarEdicao(${pedido.id})">Cancelar</button>
        </div>
      `;
      pendentes.appendChild(li);
      verificarExpiracao(pedido);
    } else {
      li.classList.add("concluido");
      li.innerHTML = `
        <strong>${pedido.numero}</strong><br>
        ${pedido.descricao}<br>
        Criado em: ${pedido.dataCriacao.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}<br>
        Expirado em: ${pedido.expira.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}<br>
        <button onclick="excluirPedido(${pedido.id})" class="btn-excluir">Excluir</button>
      `;
      concluidos.appendChild(li);
    }
  });

  salvarPedidos();
}

function abrirEdicao(id) {
  document.getElementById(`view-${id}`).style.display = "none";
  document.getElementById(`edit-${id}`).style.display = "block";
}

function cancelarEdicao(id) {
  document.getElementById(`edit-${id}`).style.display = "none";
  document.getElementById(`view-${id}`).style.display = "block";
}

// Salvar edição
async function salvarEdicao(id) {
  const pedido = pedidos.find(p => p.id === id);
  if (!pedido) return;

  const novoNumero = document.getElementById(`edit-num-${id}`).value.trim();
  const novaDesc = document.getElementById(`edit-desc-${id}`).value.trim();
  const novaData = document.getElementById(`edit-exp-${id}`).value;

  if (!novoNumero || !novaDesc || !novaData) {
    alert("Preencha todos os campos para salvar!");
    return;
  }

  const novaExpiracao = new Date(novaData);
  const agora = new Date();

  if (novaExpiracao <= agora) {
    alert("A data de expiração não pode ser no passado!");
    return;
  }

  // Verificar se o novo número já existe em outro pedido
  const { data: numeroExistente } = await supabase.from('pedidos').select('id').eq('numero', novoNumero).neq('id', id).maybeSingle();
  if (numeroExistente) {
    alert("Já existe um pedido com este número!");
    return;
  }

  await supabase.from('pedidos').update({
    numero: novoNumero,
    descricao: novaDesc,
    expira: novaExpiracao.toISOString(),
    notificado: false
  }).eq('id', id);
  cancelarEdicao(id);
}

// Marcar como concluído
async function marcarComoConcluido(id) {
  await supabase.from('pedidos').update({ status: 'concluido' }).eq('id', id);
}

// Buscar todos os emails cadastrados no Supabase Auth
async function buscarEmailsUsuarios() {
  const { data, error } = await supabase.rpc('get_all_users');
  if (!error && data) {
    emailsUsuarios = data.map(u => u.email);
    console.log('Emails encontrados:', emailsUsuarios);
  } else {
    console.error('Erro ao buscar emails dos usuários:', error);
  }
}

// Buscar todos os telefones cadastrados no Supabase Auth
async function buscarTelefonesUsuarios() {
  const { data, error } = await supabase.rpc('get_all_phones');
  if (!error && data) {
    return data.map(u => u.phone);
  }
  return [];
}

// Atualizar função de notificação para garantir busca dos emails
async function verificarExpiracao(pedido) {
  if (pedido.status !== "pendente" || pedido.notificado) return;
  const agora = new Date();
  const horasRestantes = (pedido.expira - agora) / 3600000;
  if (horasRestantes <= 6 && horasRestantes > 0) {
    await notificarPorWhatsappWebhook(pedido.criador, pedido.numero, Math.floor(horasRestantes));
    await supabase.from('pedidos').update({ notificado: true }).eq('id', pedido.id);
    console.log(`Notificação WhatsApp enviada para o criador do pedido ${pedido.numero}`);
  }
  if (horasRestantes <= 0 && !pedido.notificado) {
    await supabase.from('pedidos').update({ status: 'concluido', notificado: true }).eq('id', pedido.id);
    console.log(`Pedido ${pedido.numero} marcado como concluído automaticamente por ter expirado`);
  }
}

function mostrarAba(qual) {
  const pendentes = document.getElementById("abaPendentes");
  const concluidos = document.getElementById("abaConcluidos");
  const btnPendentes = document.getElementById("btnPendentes");
  const btnConcluidos = document.getElementById("btnConcluidos");

  if (qual === 'pendentes') {
    pendentes.style.display = 'block';
    concluidos.style.display = 'none';
    btnPendentes.classList.add('ativo');
    btnConcluidos.classList.remove('ativo');
  } else {
    pendentes.style.display = 'none';
    concluidos.style.display = 'block';
    btnPendentes.classList.remove('ativo');
    btnConcluidos.classList.add('ativo');
  }
}

function buscarPedidos(status, buscarExato = false) {
  const campoBusca = document.getElementById(`busca${status}`);
  const termoBusca = campoBusca.value.toLowerCase().trim();
  
  // Se não houver termo de busca, atualizar normalmente
  if (!termoBusca) {
    atualizarListas();
    return;
  }

  const lista = document.getElementById(`lista${status}`);
  lista.innerHTML = "";

  const statusBusca = status === "Pendentes" ? "pendente" : "concluido";

  const pedidosFiltrados = pedidos.filter(pedido => {
    if (pedido.status !== statusBusca) return false;
    
    const numeroPedido = String(pedido.numero).toLowerCase().trim();
    const descricaoPedido = String(pedido.descricao).toLowerCase().trim();
    
    if (buscarExato) {
      return numeroPedido === termoBusca;
    } else {
      return numeroPedido.includes(termoBusca);
    }
  });

  if (pedidosFiltrados.length === 0) {
    const li = document.createElement("li");
    li.innerHTML = `<p>Nenhum pedido encontrado com o número: "${termoBusca}"</p>`;
    lista.appendChild(li);
    return;
  }

  pedidosFiltrados.forEach(pedido => {
    const li = document.createElement("li");

    if (status === "Pendentes") {
      li.innerHTML = `
        <div id="view-${pedido.id}">
          <strong>Número:</strong> ${pedido.numero}<br>
          <strong>Descrição:</strong> ${pedido.descricao}<br>
          <strong>Criado em:</strong> ${pedido.dataCriacao.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}<br>
          <strong>Expira em:</strong> ${pedido.expira.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}<br>
          <button id="editar" onclick="abrirEdicao(${pedido.id})">Editar</button>
          <button id="concluir" onclick="marcarComoConcluido(${pedido.id})">Concluir</button>
          <button onclick="excluirPedido(${pedido.id})" class="btn-excluir">Excluir</button>
        </div>
        <div id="edit-${pedido.id}" style="display: none;">
          <input value="${pedido.numero}" id="edit-num-${pedido.id}" />
          <input value="${pedido.descricao}" id="edit-desc-${pedido.id}" />
          <input type="datetime-local" value="${pedido.expira.toISOString().slice(0, 16)}" id="edit-exp-${pedido.id}" />
          <button onclick="salvarEdicao(${pedido.id})">Salvar</button>
          <button onclick="cancelarEdicao(${pedido.id})">Cancelar</button>
        </div>
      `;
      verificarExpiracao(pedido);
    } else {
      li.classList.add("concluido");
      li.innerHTML = `
        <strong>${pedido.numero}</strong><br>
        ${pedido.descricao}<br>
        Criado em: ${pedido.dataCriacao.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}<br>
        Expirado em: ${pedido.expira.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}<br>
        <button onclick="excluirPedido(${pedido.id})" class="btn-excluir">Excluir</button>
      `;
    }
    lista.appendChild(li);
  });
}

// Função para lidar com o evento de tecla pressionada
function handleBuscaKeyPress(event, status) {
  if (event.key === 'Enter') {
    buscarPedidos(status, true); // Busca exata quando pressiona Enter
  } else {
    buscarPedidos(status, false); // Busca parcial enquanto digita
  }
}

// Função para definir a data mínima no campo de data
function configurarDataMinima() {
  const dataMinima = new Date();
  const ano = dataMinima.getFullYear();
  const mes = String(dataMinima.getMonth() + 1).padStart(2, '0');
  const dia = String(dataMinima.getDate()).padStart(2, '0');
  const hora = String(dataMinima.getHours()).padStart(2, '0');
  const minuto = String(dataMinima.getMinutes()).padStart(2, '0');
  
  const dataFormatada = `${ano}-${mes}-${dia}T${hora}:${minuto}`;
  document.getElementById("expiraEm").min = dataFormatada;
}

// Carregar e atualizar ao iniciar
carregarPedidos();
atualizarListas();
configurarDataMinima();

// Verificar pedidos a cada 5 minutos
setInterval(verificarExpiracao, 300000);

// Atualizar a data mínima a cada minuto
setInterval(configurarDataMinima, 60000);

// Supabase Realtime: escutar mudanças na tabela pedidos
supabase.channel('pedidos-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, carregarPedidos)
  .subscribe();

async function notificarPorWhatsappWebhook(telefone, pedidoNumero, horasRestantes) {
  await fetch('http://localhost:5678/webhook/numero', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      numero: telefone,
      pedido: pedidoNumero,
      horas: horasRestantes
    })
  });
}

