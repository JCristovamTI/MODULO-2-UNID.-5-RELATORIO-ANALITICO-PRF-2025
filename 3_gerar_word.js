const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, ImageRun, PageBreak,
  VerticalAlign, convertInchesToTwip
} = require("docx");

// ---------- helpers ----------
const NAVY = "1F3864";
const BLUE = "2E5395";
const LIGHTBLUE = "DCE6F1";
const RED = "C0392B";
const GREY = "595959";
const LIGHTGREY = "F2F2F2";

function hr() {
  return new Paragraph({
    border: { bottom: { color: "BFBFBF", space: 1, style: BorderStyle.SINGLE, size: 6 } },
    spacing: { after: 200 },
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 30 })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: BLUE, size: 25 })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    children: Array.isArray(text) ? text : [new TextRun({ text, size: 22, ...opts })],
  });
}

function bold(text, extra = {}) {
  return new TextRun({ text, bold: true, size: 22, ...extra });
}
function reg(text, extra = {}) {
  return new TextRun({ text, size: 22, ...extra });
}

function italicNote(text) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, italics: true, size: 20, color: GREY })],
  });
}

function bulletList(items) {
  return items.map(
    (t) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 100 },
        children: [new TextRun({ text: t, size: 22 })],
      })
  );
}

function cellText(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    children: [new TextRun({ text, bold: !!opts.bold, size: opts.size || 20, color: opts.color })],
  });
}

function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: BLUE },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [cellText(text, { bold: true, color: "FFFFFF", align: AlignmentType.CENTER, size: 20 })],
  });
}

function bodyCell(text, width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children: [cellText(text, { align: opts.align || AlignmentType.CENTER, bold: opts.bold, size: 20 })],
  });
}

function makeTable(headers, rows, widths, opts = {}) {
  const tableWidth = widths.reduce((a, b) => a + b, 0);
  const trHeader = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((htxt, i) => headerCell(htxt, widths[i])),
  });
  const trRows = rows.map((r, ridx) => {
    return new TableRow({
      cantSplit: true,
      children: r.map((c, i) =>
        bodyCell(c, widths[i], {
          align: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
          shade: ridx % 2 === 1 ? LIGHTGREY : undefined,
          bold: opts.boldFirstCol && i === 0,
        })
      ),
    });
  });
  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [trHeader, ...trRows],
  });
}

function imageParagraph(path, widthIn, heightIn) {
  const data = fs.readFileSync(path);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
    children: [
      new ImageRun({
        data,
        transformation: { width: widthIn * 96, height: heightIn * 96 },
        type: "png",
      }),
    ],
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text, italics: true, size: 19, color: GREY })],
  });
}

function calloutBox(title, text) {
  return new Table({
    width: { size: 9350, type: WidthType.DXA },
    columnWidths: [9350],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9350, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: LIGHTBLUE },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
              left: { style: BorderStyle.SINGLE, size: 24, color: BLUE },
              right: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
            },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [new TextRun({ text: title, bold: true, size: 22, color: NAVY })],
              }),
              new Paragraph({
                children: [new TextRun({ text, size: 21 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function kpiCard(label, value, sub) {
  return new TableCell({
    width: { size: 2340, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: "F2F6FC" },
    margins: { top: 180, bottom: 180, left: 120, right: 120 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "B4C7E7" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "B4C7E7" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "B4C7E7" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "B4C7E7" },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: label, size: 17, color: GREY, bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: value, size: 32, bold: true, color: NAVY })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: sub || "", size: 16, color: GREY })],
      }),
    ],
  });
}

// ================= DOCUMENT CONTENT =================

const titleBlock = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: "RELATÓRIO ANALÍTICO · ANÁLISE EXPLORATÓRIA DE DADOS", bold: true, size: 20, color: GREY, allCaps: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "Acidentes de Trânsito em Rodovias Federais — 2025", bold: true, size: 40, color: NAVY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: "Mortalidade nos acidentes registrados pela Polícia Rodoviária Federal ao longo do ano de 2025", italics: true, size: 23, color: GREY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "Fonte dos dados: Dados Abertos PRF — Boletins de Acidentes de Trânsito (datatran2025.csv)", size: 20, color: GREY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [
      new TextRun({ text: "Variável-alvo: ", size: 21 }),
      new TextRun({ text: "MORTOS", bold: true, size: 21, color: RED }),
      new TextRun({ text: " (registro possui ao menos 1 vítima fatal)  |  Período: 01/01/2025 a 31/12/2025  |  72.529 registros analisados", size: 21 }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "Elaborado para: [Nome do destinatário / equipe]", size: 20, italics: true, color: GREY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "Elaborado por: [Seu nome aqui]        Data: [dd/mm/aaaa]", size: 20, italics: true, color: GREY })],
  }),
  hr(),
];

// ---------- Section 1 ----------
const sec1 = [
  h1("1. Sumário executivo"),
  p([
    reg("Em 2025, a base de dados abertos da PRF registrou "),
    bold("72.529 acidentes"),
    reg(" de trânsito em rodovias federais. Desse total, "),
    bold("5.210 acidentes (7,18%)"),
    reg(" tiveram ao menos uma vítima fatal, somando "),
    bold("6.043 mortos"),
    reg(" — uma taxa de "),
    bold("8,33 mortos a cada 100 acidentes"),
    reg(". Este relatório aplica o roteiro de EDA (indicadores → rankings/séries → análise bivariada com o alvo → combinações de fatores → síntese de hipóteses), tratando a variável-alvo como "),
    bold("MORTOS"),
    reg(" (ocorrência de vítima fatal no acidente)."),
  ]),
];

const kpiTable = new Table({
  width: { size: 9350, type: WidthType.DXA },
  columnWidths: [2340, 2340, 2335, 2335],
  rows: [
    new TableRow({
      children: [
        kpiCard("TOTAL DE REGISTROS", "72.529", "acidentes em 2025"),
        kpiCard("ACIDENTES COM VÍTIMA FATAL", "5.210 (7,18%)", "eventos-alvo"),
        kpiCard("TOTAL DE MORTOS", "6.043", "vítimas fatais"),
        kpiCard("TAXA / 100", "8,33", "mortos por 100 acidentes"),
      ],
    }),
  ],
});

const sec1b = [
  new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),
  calloutBox(
    "Achado central:",
    "O tipo e a causa do acidente pesam mais do que o volume. A colisão traseira é o tipo mais comum (14.360 casos), mas apenas 4,31% resultam em morte. Já a colisão frontal (4.739 casos) e o atropelamento de pedestre (3.057 casos) têm letalidade de aproximadamente 29,5% — quase 7 vezes a taxa da ocorrência mais frequente. Volume alto não significa risco alto: os padrões que mais matam não são os que mais acontecem."
  ),
];

// ---------- Section 2 ----------
const sec2 = [
  h1("2. Estatística descritiva e indicadores globais"),
  p("A tabela abaixo consolida os indicadores globais da base — o ponto de partida para qualquer leitura segmentada nas seções seguintes."),
  makeTable(
    ["Indicador", "Valor"],
    [
      ["Total de registros (acidentes)", "72.529"],
      ["Total de vítimas fatais (mortos)", "6.043"],
      ["Acidentes com ao menos 1 vítima fatal", "5.210 (7,18%)"],
      ["Taxa de mortos por 100 acidentes", "8,33"],
      ["Total de feridos graves", "20.018"],
      ["Total de feridos leves", "63.532"],
      ["Total de pessoas envolvidas", "188.346"],
      ["Total de veículos envolvidos", "144.922"],
      ["Média de pessoas por acidente", "2,60"],
      ["Mediana de mortos por acidente", "0 (distribuição fortemente assimétrica)"],
    ],
    [5850, 3500]
  ),
  new Paragraph({ spacing: { before: 200 } }),
  p(
    "A variável mortos é fortemente assimétrica à direita: em 92,8% dos registros o valor é zero, e o máximo observado em um único acidente foi 16 óbitos. Por isso a análise segue tratando o indicador-alvo como uma proporção binária (acidente teve ou não vítima fatal) e como taxa por 100 acidentes, em vez de comparar médias — médias seriam fortemente distorcidas por poucos acidentes com múltiplas vítimas."
  ),
];

// ---------- Section 3 ----------
const sec3 = [
  h1("3. Rankings — onde os acidentes acontecem"),
  h2("3.1 Por Unidade da Federação (UF)"),
  p("Ranking das 10 UFs com maior volume de acidentes, com a respectiva taxa de letalidade (% de acidentes com vítima fatal):"),
  makeTable(
    ["UF", "Registros", "Mortos", "% com vítima fatal"],
    [
      ["MG", "9.570", "765", "6,76%"],
      ["SC", "8.186", "434", "4,57%"],
      ["PR", "7.630", "593", "6,70%"],
      ["RJ", "6.428", "330", "4,76%"],
      ["RS", "4.899", "327", "5,61%"],
      ["SP", "4.683", "221", "4,38%"],
      ["BA", "4.108", "583", "11,59%"],
      ["GO", "3.196", "308", "7,73%"],
      ["PE", "3.013", "336", "10,02%"],
      ["ES", "2.642", "161", "5,49%"],
    ],
    [2000, 2450, 2450, 2450],
    { boldFirstCol: true }
  ),
  new Paragraph({ spacing: { before: 200 } }),
  calloutBox(
    "Atenção à confusão volume x proporção:",
    "Minas Gerais concentra o maior volume absoluto de acidentes (9.570), mas sua letalidade (6,76%) fica abaixo da taxa global (7,18%). Já a Bahia, com menos da metade dos registros de MG (4.108), tem letalidade de 11,59% — o maior valor entre as UFs de alto volume, quase o dobro da taxa mineira. Pernambuco (10,02%) e Piauí (10,00%, fora do top 10 em volume) seguem o mesmo padrão. Estados do Nordeste concentram maior letalidade proporcional, mesmo sem liderar em volume absoluto."
  ),

  h2("3.2 Por rodovia (BR)"),
  p("Comparando as rodovias federais de maior tráfego com as de maior letalidade proporcional (aplicado filtro mínimo de 150 registros para evitar percentuais instáveis):"),
];

function twoTablesSideBySide(headersL, rowsL, headersR, rowsR) {
  const wL = [1550, 1400, 1100];
  const wR = [1550, 1400, 1100];
  const tL = makeTable(headersL, rowsL, wL);
  const tR = makeTable(headersR, rowsR, wR);
  return new Table({
    width: { size: 9350, type: WidthType.DXA },
    columnWidths: [4050, 250, 4050],
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({ width: { size: 4050, type: WidthType.DXA }, children: [tL], margins: { right: 150 } }),
          new TableCell({ width: { size: 250, type: WidthType.DXA }, children: [new Paragraph("")] }),
          new TableCell({ width: { size: 4050, type: WidthType.DXA }, children: [tR], margins: { left: 150 } }),
        ],
      }),
    ],
  });
}

const sec3b = [
  new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: "Maior volume de tráfego", bold: true, size: 21, color: BLUE })],
  }),
];

const br_side_by_side = twoTablesSideBySide(
  ["BR", "Registros", "% fatal"],
  [
    ["BR-101", "13.014", "5,24%"],
    ["BR-116", "11.021", "5,79%"],
    ["BR-040", "3.502", "5,14%"],
  ],
  ["BR", "Registros", "% fatal"],
  [
    ["BR-423", "183", "21,86%"],
    ["BR-242", "283", "19,08%"],
    ["BR-222", "581", "18,24%"],
  ]
);

const sec3c = [
  new Paragraph({ spacing: { before: 220 } }),
  calloutBox(
    "Atenção à confusão volume x proporção:",
    "As rodovias de maior tráfego nacional (BR-101 e BR-116) apresentam letalidade abaixo da média global (5,2%–5,8% vs. 7,18%), possivelmente por terem trechos duplicados e maior fiscalização. Já rodovias de médio porte como a BR-423 (BA/PE), BR-242 (BA) e BR-222 (MA/PI/CE) chegam a 18%–22% de letalidade — 2,5 a 3 vezes a taxa global — reforçando o padrão regional observado na análise por UF."
  ),

  h2("3.3 Por município"),
  p("Os 10 municípios com maior volume concentram uma fração relevante dos registros nacionais, mas não são necessariamente os mais letais. Ao aplicar um filtro mínimo de 80 registros, emergem municípios menores com letalidade proporcional muito acima da média:"),
];

const chart1 = [
  imageParagraph("chart1_municipios.png", 6.5, 2.55),
  caption("Gráfico 1 — Top 10 municípios por volume de acidentes (esquerda) e top 10 municípios por % de acidentes com vítima fatal, entre os que têm ao menos 80 registros (direita), com a taxa global de 7,18% tracejada."),
];

// ---------- Section 4 ----------
const sec4 = [
  h1("4. Séries temporais"),
  h2("4.1 Série mensal"),
  p("O volume de acidentes cresce de forma moderada ao longo do ano, com pico em dezembro (6.788 registros, período de festas e maior fluxo nas rodovias) e vale em fevereiro (5.287). A proporção de acidentes fatais, no entanto, não acompanha estritamente essa tendência de volume: maio se destaca com o maior percentual do ano (8,27%), acima da taxa global mesmo sendo um mês de volume moderado."),
];

const chart2 = [
  imageParagraph("chart2_mensal.png", 6.5, 2.2),
  caption("Gráfico 2 — Volume mensal de acidentes (esquerda) e % de acidentes com vítima fatal por mês (direita), com a taxa global de 7,18% tracejada."),
];

const sec4b = [
  h2("4.2 Por turno do dia"),
  p("O turno concentra um dos achados mais fortes do relatório: o volume de acidentes é menor na madrugada, mas a letalidade nesse período é a mais alta, de longe."),
  makeTable(
    ["Turno", "Registros", "Mortos", "% com vítima fatal"],
    [
      ["Madrugada (00h–06h)", "8.907", "1.270", "12,10%"],
      ["Manhã (06h–12h)", "20.859", "1.230", "4,93%"],
      ["Tarde (12h–18h)", "22.302", "1.434", "5,53%"],
      ["Noite (18h–24h)", "20.461", "2.109", "9,13%"],
    ],
    [2600, 2250, 2250, 2250],
    { boldFirstCol: true }
  ),
  new Paragraph({ spacing: { before: 200 } }),
  p([
    reg("Vale destacar que a "),
    bold("madrugada"),
    reg(" concentra apenas 12,3% dos registros, mas tem letalidade de "),
    bold("12,10%"),
    reg(" — mais que o dobro da taxa da manhã (4,93%) e quase o triplo em termos relativos. A "),
    bold("noite"),
    reg(" também fica acima da média global (9,13%). Juntos, madrugada e noite concentram 40,4% dos acidentes mas 55,9% dos mortos da base."),
  ]),
];

const chart3 = [
  imageParagraph("chart3_turno.png", 6.5, 2.15),
  caption("Gráfico 3 — Volume de acidentes por turno (esquerda) e % de acidentes com vítima fatal por turno (direita), com a taxa global de 7,18% tracejada."),
];

// ---------- Section 5 ----------
const sec5 = [
  h1("5. Análise bivariada — o que mais se associa ao indicador-alvo"),
  h2("5.1 Tipo de acidente"),
  p([
    reg("Este é um dos achados mais fortes da base: o tipo de acidente mais frequente ("),
    bold("colisão traseira", { color: RED }),
    reg(", 14.360 casos) tem letalidade de apenas "),
    bold("4,31%"),
    reg(", enquanto a "),
    bold("colisão frontal"),
    reg(" (4.739 casos) e o "),
    bold("atropelamento de pedestre"),
    reg(" (3.057 casos) chegam a "),
    bold("29,46%"),
    reg(" e "),
    bold("29,51%"),
    reg(" respectivamente — quase 7 vezes mais letais que a ocorrência mais comum."),
  ]),
  makeTable(
    ["Tipo de acidente", "Registros", "Mortos", "% alvo"],
    [
      ["Colisão traseira", "14.360", "683", "4,31%"],
      ["Saída de leito carroçável", "10.209", "700", "5,93%"],
      ["Colisão transversal", "9.306", "481", "4,59%"],
      ["Colisão frontal", "4.739", "1.863", "29,46%"],
      ["Atropelamento de Pedestre", "3.057", "919", "29,51%"],
    ],
    [3350, 2000, 2000, 2000],
    { boldFirstCol: true }
  ),
];

const chart4 = [
  imageParagraph("chart4_composicao.png", 6.5, 2.15),
  caption("Gráfico 4 — Composição por desfecho (sem vítimas / com vítimas feridas / com vítimas fatais) nos tipos de acidente mais frequentes."),
];

const sec5b = [
  h2("5.2 Causa do acidente"),
  p("Aplicando um filtro mínimo de 1.000 registros por causa para evitar percentuais instáveis, as causas mais associadas à letalidade são:"),
  makeTable(
    ["Causa (mín. 1.000 registros)", "Registros", "Mortos", "% alvo"],
    [
      ["Transitar na contramão", "2.475", "961", "29,74%"],
      ["Ultrapassagem Indevida", "1.770", "404", "17,06%"],
      ["Velocidade Incompatível", "4.088", "470", "9,42%"],
      ["Ausência de reação do condutor", "11.469", "855", "6,79%"],
    ],
    [4200, 1800, 1650, 1700],
    { boldFirstCol: true }
  ),
];

const chart5 = [
  imageParagraph("chart5_causas.png", 6.2, 3.1),
  caption("Gráfico 5 — % de acidentes com vítima fatal nas 12 causas mais frequentes (mín. 1.000 registros), com a taxa global de 7,18% tracejada."),
];

const sec5c = [
  h2("5.3 Condição meteorológica e turno"),
  p("A leitura a seguir prioriza o padrão mais robusto em volume, evitando basear conclusões em condições raras (como neve, que teve apenas 1 registro na base):"),
];

const cond_turno_side = twoTablesSideBySide(
  ["Condição", "Registros", "% alvo"],
  [
    ["Nevoeiro/Neblina", "553", "10,85%"],
    ["Céu Claro", "46.375", "7,37%"],
    ["Chuva", "6.438", "6,24%"],
    ["Sol", "4.201", "5,88%"],
  ],
  ["Turno", "Registros", "% alvo"],
  [
    ["Madrugada", "8.907", "12,10%"],
    ["Noite", "20.461", "9,13%"],
    ["Tarde", "22.302", "5,53%"],
    ["Manhã", "20.859", "4,93%"],
  ]
);

const sec5d = [
  new Paragraph({ spacing: { before: 220 } }),
  p("O céu claro concentra 64% dos registros (condição mais comum de tráfego) e tem letalidade próxima da média global. A neblina, embora rara (553 casos), é a condição climática mais letal (10,85%) — coerente com a perda de visibilidade. Ainda assim, o fator turno (ausência de luz natural) mostra variação proporcionalmente maior e mais robusta em volume do que a condição meteorológica isoladamente."),
];

const chart6 = [
  imageParagraph("chart6_condicao_turno.png", 6.5, 2.2),
  caption("Gráfico 6 — % de acidentes com vítima fatal por condição meteorológica (esquerda, mín. 100 registros) e por turno (direita), com a taxa global de 7,18% tracejada."),
];

const sec5e = [
  h2("5.4 Tipo de pista e uso do solo"),
];

const pista_solo_side = twoTablesSideBySide(
  ["Tipo de pista", "Registros", "% alvo"],
  [
    ["Simples", "34.733", "9,86%"],
    ["Dupla", "30.782", "4,88%"],
    ["Múltipla", "7.014", "4,06%"],
  ],
  ["Uso do solo", "Registros", "% alvo"],
  [
    ["Rural (Não)", "41.444", "9,11%"],
    ["Urbano (Sim)", "31.085", "4,62%"],
  ]
);

const sec5f = [
  new Paragraph({ spacing: { before: 220 } }),
  calloutBox(
    "Achados mais acionáveis do relatório:",
    "Pistas simples (sem separação física entre sentidos) têm letalidade de 9,86% — mais que o dobro das pistas múltiplas (4,06%) e quase o dobro das duplas (4,88%). Trechos rurais têm letalidade quase 2x maior que trechos urbanos (9,11% vs. 4,62%), coerente com maior velocidade praticada, menor iluminação e tempo de resposta de socorro mais longo. A hipótese causal mais plausível é a ausência de barreira física central em pistas simples, que facilita colisões frontais — o tipo de acidente mais letal identificado na Seção 5.1."
  ),
];

const chart7 = [
  imageParagraph("chart7_heatmap.png", 6.3, 2.35),
  caption("Gráfico 7 — % de acidentes com vítima fatal por Tipo de Pista x Fase do Dia."),
];

// ---------- Section 6 ----------
const sec6 = [
  h1("6. Combinações de fatores e correlação"),
  p("Cruzando causa do acidente com a fase do dia (mínimo de 200 registros por combinação para estabilidade), as combinações mais associadas à letalidade envolvem pedestres e contramão à noite:"),
  makeTable(
    ["Causa", "Fase do dia", "Registros", "% alvo"],
    [
      ["Pedestre andava na pista", "Plena Noite", "419", "47,26%"],
      ["Entrada inopinada do pedestre", "Plena Noite", "351", "37,04%"],
      ["Pedestre cruzava fora da faixa", "Plena Noite", "279", "31,90%"],
      ["Transitar na contramão", "Plena Noite", "1.146", "31,59%"],
    ],
    [3400, 2000, 1900, 2050],
    { boldFirstCol: true }
  ),
  new Paragraph({ spacing: { before: 220 } }),
  p("Repetindo o cruzamento para tipo de pista x turno, o padrão de risco na pista simples se intensifica ainda mais na madrugada:"),
  makeTable(
    ["Tipo de pista", "Turno", "Registros", "% alvo"],
    [
      ["Simples", "Madrugada", "4.307", "15,90%"],
      ["Simples", "Noite", "10.257", "11,84%"],
      ["Múltipla", "Madrugada", "776", "8,63%"],
      ["Dupla", "Madrugada", "3.824", "8,53%"],
    ],
    [3400, 2000, 1900, 2050],
    { boldFirstCol: true }
  ),
  new Paragraph({ spacing: { before: 220 } }),
  p("A matriz de correlação de Pearson entre as variáveis numéricas e o alvo ajuda a identificar redundâncias — note que 'mortos' tem baixa correlação linear com as demais variáveis, o que reforça que a letalidade é mais bem explicada por fatores categóricos (tipo, causa, pista, turno) do que pelo número de pessoas ou veículos envolvidos:"),
];

const chart8 = [
  imageParagraph("chart8_correlacao.png", 5.5, 4.2),
  caption("Gráfico 8 — Matriz de correlação de Pearson entre variáveis numéricas da base (pessoas, mortos, feridos leves, feridos graves, ilesos, veículos)."),
];

// ---------- Section 7 ----------
const sec7 = [
  h1("7. Síntese, hipóteses e limitações"),
  makeTable(
    ["Achado", "Evidência", "Hipótese (a investigar)", "Limitação"],
    [
      [
        "Tipo de acidente pesa mais que volume: colisão frontal e atropelamento de pedestre são ~7x mais letais que a colisão traseira, a mais comum",
        "Colisão traseira: 4,31% fatal (n=14.360); Colisão frontal: 29,46% (n=4.739); Atropelamento pedestre: 29,51% (n=3.057)",
        "Energia de impacto frontal/direto sobre pedestre é muito maior que colisões traseiras em baixa velocidade relativa",
        "Classificação do tipo de acidente depende do critério do agente que registra o boletim",
      ],
      [
        "BA, PE e PI concentram as maiores letalidades entre UFs/rodovias de maior volume no Nordeste",
        "BA: 11,59% (n=4.108) vs. MG (maior volume): 6,76% (n=9.570). BR-423/242/222 chegam a 18%-22%",
        "Extensão de trechos de pista simples, iluminação e fiscalização variam por estado",
        "UFs e rodovias com poucos acidentes no total podem ter percentuais instáveis; olhar volume junto",
      ],
      [
        "Pista simples e período noturno/madrugada multiplicam a letalidade, e o efeito se soma quando combinados",
        "Pista simples: 9,86% vs. dupla: 4,88%; madrugada: 12,10% vs. manhã: 4,93%; combinação pista simples + madrugada: 15,90%",
        "Ausência de divisão física de pista, menor visibilidade e maior velocidade praticada à noite aumentam a severidade de colisões frontais e saídas de pista",
        "Não é possível isolar o efeito do fluxo de veículos e da velocidade real sem dados de tráfego",
      ],
    ],
    [2450, 2450, 2450, 2000]
  ),
  new Paragraph({ spacing: { before: 280 } }),
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: "Erros a evitar na leitura deste relatório", bold: true, size: 23, color: NAVY })],
  }),
  ...bulletList([
    "Confundir volume com proporção do indicador-alvo — Minas Gerais tem o maior volume de acidentes, mas letalidade abaixo da média; a Bahia, o inverso.",
    "Tratar percentuais de categorias com poucos registros como conclusão robusta — sempre olhar o volume junto (por isso os filtros mínimos aplicados nas Seções 3, 5 e 6).",
    "Tratar correlação como causalidade, especialmente entre variáveis que compõem, por definição, o próprio desfecho do acidente (ex.: feridos graves e mortos).",
    "Generalizar um achado de um subgrupo, causa ou horário para o total sem checar se ele se repete em outros recortes.",
  ]),
  new Paragraph({ spacing: { before: 200, after: 120 } }),
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: "Limitações gerais da base", bold: true, size: 23, color: NAVY })],
  }),
  ...bulletList([
    "A base cobre exclusivamente acidentes registrados pela PRF em rodovias federais, não incluindo rodovias estaduais, municipais ou vias urbanas fora da malha federal.",
    "Campos como causa_acidente e tipo_acidente dependem do julgamento do policial rodoviário federal que preenche o boletim de ocorrência no local, sujeitos a critério humano.",
    "A análise é descritiva e associativa; não deve embasar decisões de política pública ou investimento em infraestrutura sozinha, sem estudos de engenharia de tráfego complementares.",
    "Não foram identificados valores ausentes relevantes nas colunas analisadas; registros com 'Ignorado' ou 'Não Informado' foram mantidos como categoria própria nas tabelas.",
  ]),
];

// ---------- Section 8 (extra) ----------
const sec8 = [
  h1("8. Interpretação, hipóteses e limites (detalhado)"),
  p("Cada achado relevante segue o modelo: Achado → Evidência → Comparação com a taxa global → Hipótese → Limitação."),
  makeTable(
    ["#", "Achado", "Evidência", "Comparação", "Hipótese (a investigar)", "Limitação"],
    [
      [
        "1",
        "Bahia (BA), Pernambuco (PE) e Piauí (PI) têm as maiores letalidades entre as UF de maior volume",
        "~10%–11,6%",
        "Acima da taxa global (7,18%)",
        "Extensão de trechos de pista simples, iluminação e fiscalização podem variar por estado",
        "UF com poucos acidentes no total podem ter percentuais instáveis; olhar sempre volume junto",
      ],
      [
        "2",
        "Colisão frontal e atropelamento de pedestre são muito mais letais que a colisão traseira",
        "~29,5% vs. 4,3%",
        "4 a 4,1x acima da taxa global",
        "Energia de impacto direto (frontal/pedestre) é muito maior que colisão traseira em baixa velocidade",
        "Classificação do tipo de acidente é feita a critério do agente no boletim",
      ],
      [
        "3",
        "Pedestres atropelados à noite têm letalidade extrema",
        "47,3% em 'pedestre andava na pista' à noite",
        "Mais de 6x acima da taxa global",
        "Baixa visibilidade do pedestre à noite associada a maior velocidade praticada",
        "Volume da combinação específica é moderado (n=419); interpretar com cautela",
      ],
      [
        "4",
        "Pista simples e madrugada têm efeito combinado sobre a letalidade",
        "15,9% na combinação pista simples + madrugada",
        "Mais de 2x acima da taxa global",
        "Ausência de divisão física de pista somada à menor visibilidade noturna",
        "Não é possível isolar o efeito do fluxo real de veículos sem dados de tráfego",
      ],
    ],
    [450, 2350, 1450, 1350, 2350, 1400]
  ),
];

// ================= BUILD DOCUMENT =================
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 }, // US Letter
          margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 },
        },
      },
      children: [
        ...titleBlock,
        ...sec1,
        kpiTable,
        ...sec1b,
        ...sec2,
        ...sec3,
        sec3b[0],
        br_side_by_side,
        ...sec3c,
        ...chart1,
        ...sec4,
        ...chart2,
        ...sec4b,
        ...chart3,
        ...sec5,
        ...chart4,
        ...sec5b,
        ...chart5,
        ...sec5c,
        cond_turno_side,
        ...sec5d,
        ...chart6,
        ...sec5e,
        pista_solo_side,
        ...sec5f,
        ...chart7,
        ...sec6,
        ...chart8,
        ...sec7,
        new Paragraph({ children: [new PageBreak()] }),
        ...sec8,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/mnt/user-data/outputs/Relatorio_Analitico_PRF_2025_Mortalidade.docx", buffer);
  console.log("Documento gerado com sucesso.");
});
