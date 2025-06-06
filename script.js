(function(){
      emailjs.init({
        publicKey: "yYjrTa1UFxHMyz0K6",
      });
})();

let pedidos = [];

function carregarPedidos() {
  const dados = localStorage.getItem("pedidos");
  if (dados) {
    pedidos = JSON.parse(dados);
    pedidos.forEach(pedido => {
      pedido.expira = new Date(pedido.expira);
      pedido.dataCriacao = new Date(pedido.dataCriacao);
    });
  }
}

function salvarPedidos() {
  localStorage.setItem("pedidos", JSON.stringify(pedidos));
}

function adicionarPedido() {
  const numero = document.getElementById("pedido").value.trim();
  const descricao = document.getElementById("descricao").value.trim();
  const expiraInput = document.getElementById("expiraEm").value;

  if (!numero || !descricao || !expiraInput) {
    document.getElementById("mensagem").textContent = "Preencha todos os campos!";
    return;
  }

  // Verificar se já existe um pedido com o mesmo número
  const pedidoExistente = pedidos.find(p => p.numero === numero);
  if (pedidoExistente) {
    document.getElementById("mensagem").textContent = "Já existe um pedido com este número!";
    return;
  }

  const expira = new Date(expiraInput);
  const agora = new Date();

  // Verificar se a data é passada
  if (expira <= agora) {
    document.getElementById("mensagem").textContent = "A data de expiração não pode ser no passado!";
    return;
  }

  if (isNaN(expira)) {
    document.getElementById("mensagem").textContent = "Data inválida!";
    return;
  }

  const id = Date.now();
  const dataCriacao = new Date();
  pedidos.push({ id, numero, descricao, expira, status: "pendente", notificado: false, dataCriacao });
  atualizarListas();
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

function excluirPedido(id) {
  if (confirm("Tem certeza que deseja excluir este pedido?")) {
    pedidos = pedidos.filter(p => p.id !== id);
    atualizarListas();
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

function salvarEdicao(id) {
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

  // Verificar se a nova data é passada
  if (novaExpiracao <= agora) {
    alert("A data de expiração não pode ser no passado!");
    return;
  }

  // Verificar se o novo número já existe em outro pedido
  const numeroExistente = pedidos.find(p => p.id !== id && p.numero === novoNumero);
  if (numeroExistente) {
    alert("Já existe um pedido com este número!");
    return;
  }

  pedido.numero = novoNumero;
  pedido.descricao = novaDesc;
  pedido.expira = novaExpiracao;
  pedido.notificado = false;

  atualizarListas();
  cancelarEdicao(id);
}

function marcarComoConcluido(id) {
  const pedido = pedidos.find(p => p.id === id);
  if (pedido) pedido.status = "concluido";
  atualizarListas();
}

function verificarExpiracao(pedido) {
  if (pedido.status !== "pendente" || pedido.notificado) return;

  const agora = new Date();
  const horasRestantes = (pedido.expira - agora) / 3600000; // Convertendo para horas

  // Verifica se está dentro do período de notificação (6 horas ou menos) e ainda não expirou
  if (horasRestantes <= 6 && horasRestantes > 0) {
    // Tenta enviar o email
    emailjs.send("service_6o2djth", "template_bmvffpx", {
      pedido: pedido.numero,
      horas: Math.floor(horasRestantes),
      descricao: pedido.descricao,
    }).then(() => {
      // Se o email foi enviado com sucesso, marca como notificado
      pedido.notificado = true;
      salvarPedidos();
      console.log(`Notificação enviada para o pedido ${pedido.numero}`);
    }).catch(error => {
      console.error("Erro ao enviar notificação:", error);
    });
  }
  
  // Se o pedido já expirou, marca como concluído automaticamente
  if (horasRestantes <= 0 && !pedido.notificado) {
    pedido.status = "concluido";
    pedido.notificado = true;
    salvarPedidos();
    console.log(`Pedido ${pedido.numero} marcado como concluído automaticamente por ter expirado`);
  }
}

// Função para verificar todos os pedidos periodicamente
function verificarTodosPedidos() {
  pedidos.forEach(pedido => {
    verificarExpiracao(pedido);
  });
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
setInterval(verificarTodosPedidos, 300000);

// Atualizar a data mínima a cada minuto
setInterval(configurarDataMinima, 60000);
