google.charts.load('current', { packages: ['gantt'] });
google.charts.setOnLoadCallback(drawChart);

let registros = [];
let filtroData = null;
let filtroNome = "";

document.getElementById('formEscala').addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const cargo = document.getElementById('cargo').value;
  const data = document.getElementById('data').value;
  const horaInicio = document.getElementById('horaInicio').value;
  const horaFim = document.getElementById('horaFim').value;

  const [ano, mes, dia] = data.split("-");
  const [hIni, mIni] = horaInicio.split(":");
  const [hFim, mFim] = horaFim.split(":");

  const inicio = new Date(ano, mes - 1, dia, hIni, mIni);
  const fim = new Date(ano, mes - 1, dia, hFim, mFim);

  registros.push({
    id: Date.now(),
    nome,
    cargo,
    inicio,
    fim
  });

  document.getElementById('formEscala').reset();
  aplicarFiltro();
});

function aplicarFiltro() {
  filtroData = document.getElementById('filtroData').value;
  filtroNome = document.getElementById('filtroNome').value.toLowerCase();
  atualizarTabela();
  drawChart();
}

function limparFiltro() {
  document.getElementById('filtroData').value = "";
  document.getElementById('filtroNome').value = "";
  filtroData = null;
  filtroNome = "";
  atualizarTabela();
  drawChart();
}

function atualizarTabela() {
  const tbody = document.querySelector('#tabelaRegistros tbody');
  tbody.innerHTML = "";

  getRegistrosFiltrados().forEach(r => {
    const tr = document.createElement('tr');
    const data = r.inicio.toISOString().split("T")[0];
    const hIni = r.inicio.toTimeString().slice(0, 5);
    const hFim = r.fim.toTimeString().slice(0, 5);

    tr.innerHTML = `
      <td>${r.nome}</td><td>${r.cargo}</td><td>${data}</td>
      <td>${hIni}</td><td>${hFim}</td>
      <td>
        <button onclick="editarRegistro(${r.id})">Editar</button>
        <button onclick="removerRegistro(${r.id})">Remover</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getRegistrosFiltrados() {
  return registros.filter(r => {
    const data = r.inicio.toISOString().split("T")[0];
    return (!filtroData || filtroData === data) &&
           (!filtroNome || r.nome.toLowerCase().includes(filtroNome));
  });
}

function drawChart() {
  const data = new google.visualization.DataTable();
  data.addColumn('string', 'ID');
  data.addColumn('string', 'Funcionário');
  data.addColumn('string', 'Cargo');
  data.addColumn('date', 'Início');
  data.addColumn('date', 'Término');
  data.addColumn('number', 'Duração');
  data.addColumn('number', 'Concluído');
  data.addColumn('string', 'Dependência');

  getRegistrosFiltrados().forEach(r => {
    data.addRow([
      r.id.toString(),
      r.nome,
      r.cargo,
      r.inicio,
      r.fim,
      null,
      100,
      null
    ]);
  });

  const chart = new google.visualization.Gantt(document.getElementById('chart_div'));
  chart.draw(data, {
    height: 300 + registros.length * 30,
    gantt: { trackHeight: 30 }
  });
}

function removerRegistro(id) {
  registros = registros.filter(r => r.id !== id);
  aplicarFiltro();
}

function editarRegistro(id) {
  const r = registros.find(r => r.id === id);
  if (!r) return;

  document.getElementById('nome').value = r.nome;
  document.getElementById('cargo').value = r.cargo;
  document.getElementById('data').value = r.inicio.toISOString().split("T")[0];
  document.getElementById('horaInicio').value = r.inicio.toTimeString().slice(0, 5);
  document.getElementById('horaFim').value = r.fim.toTimeString().slice(0, 5);

  registros = registros.filter(r => r.id !== id);
  aplicarFiltro();
}

document.getElementById('exportarCSV').addEventListener('click', function () {
  if (registros.length === 0) return alert("Nenhum dado para exportar.");

  let csv = "ID,Nome,Cargo,Data,Hora Início,Hora Fim\n";
  getRegistrosFiltrados().forEach(r => {
    const data = r.inicio.toISOString().split("T")[0];
    const hIni = r.inicio.toTimeString().slice(0, 5);
    const hFim = r.fim.toTimeString().slice(0, 5);
    csv += `${r.id},"${r.nome}","${r.cargo}",${data},${hIni},${hFim}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "escala_de_trabalho.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

document.getElementById('exportarPDF').addEventListener('click', async function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(12);
  doc.text("Escala de Trabalho", 10, 10);

  let y = 20;
  getRegistrosFiltrados().forEach(r => {
    const data = r.inicio.toISOString().split("T")[0];
    const hIni = r.inicio.toTimeString().slice(0, 5);
    const hFim = r.fim.toTimeString().slice(0, 5);
    doc.text(`${r.nome} - ${r.cargo} - ${data} ${hIni} às ${hFim}`, 10, y);
    y += 8;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("escala_de_trabalho.pdf");
});
