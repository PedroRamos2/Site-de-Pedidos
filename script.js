emailjs.init("0q64eU3jGsUFBJbZ-"); 

let pedidos = [];

function carregarPedidos() {
  const dados = localStorage.getItem("pedidos");
  if (dados) {
    pedidos = JSON.parse(dados);
    pedidos.forEach(pedido => {
      pedido.expira = new Date(pedido.expira);
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

  const expira = new Date(expiraInput);
  if (isNaN(expira)) {
    document.getElementById("mensagem").textContent = "Data inválida!";
    return;
  }

  const id = Date.now();
  pedidos.push({ id, numero, descricao, expira, status: "pendente", notificado: false });
  atualizarListas();
  document.getElementById("mensagem").textContent = "Pedido adicionado!";
  document.getElementById("pedido").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("expiraEm").value = "";
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
          <strong>Expira em:</strong> ${pedido.expira.toLocaleString()}<br>
          <button onclick="abrirEdicao(${pedido.id})">Editar</button>
          <button onclick="marcarComoConcluido(${pedido.id})">Concluir</button>
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
      li.innerHTML = `<strong>${pedido.numero}</strong><br>${pedido.descricao}<br>Expirado em: ${pedido.expira.toLocaleString()}`;
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

  pedido.numero = novoNumero;
  pedido.descricao = novaDesc;
  pedido.expira = new Date(novaData);
  pedido.notificado = false;

  atualizarListas();
}

function marcarComoConcluido(id) {
  const pedido = pedidos.find(p => p.id === id);
  if (pedido) pedido.status = "concluido";
  atualizarListas();
}

function verificarExpiracao(pedido) {
  if (pedido.status !== "pendente" || pedido.notificado) return;

  const agora = new Date();
  const horasRestantes = (pedido.expira - agora) / 3600000;

  if (horasRestantes <= 12 && horasRestantes > 0) {
    emailjs.send("service_4srkrsv", "template_ar3zbhb", {
      pedido: pedido.numero,
      horas: Math.floor(horasRestantes),
      descricao: pedido.descricao,
    }).then(() => {
      pedido.notificado = true;
      salvarPedidos();
    }).catch(console.error);
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

// Carregar e atualizar ao iniciar
carregarPedidos();
atualizarListas();
