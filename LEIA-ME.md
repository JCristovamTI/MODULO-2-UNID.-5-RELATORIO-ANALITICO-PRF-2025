# Códigos do Relatório PRF 2025 — Guia de uso no VSCode

Usei **3 scripts**, cada um com uma função diferente. Rode nesta ordem:

## 1. `1_analise_dados.py` — Análise exploratória (Python)
Lê o CSV da PRF e imprime no terminal todos os indicadores, rankings e
cruzamentos (por UF, rodovia, município, mês, turno, tipo/causa de
acidente, condição climática, correlações etc). É o script que eu rodei
para **descobrir os números** que depois usei no texto do relatório.

**Como rodar:**
```bash
pip install pandas --break-system-packages
python3 1_analise_dados.py
```
Coloque o arquivo `dados_abertos_prf-datatran2025.csv` na mesma pasta.

## 2. `2_gerar_graficos.py` — Geração dos gráficos (Python + matplotlib)
Gera os **8 gráficos PNG** em alta resolução (barras, série temporal,
barras 100% empilhadas, heatmaps), salvos na pasta `./charts/`.

**Como rodar:**
```bash
pip install pandas matplotlib --break-system-packages
python3 2_gerar_graficos.py
```

## 3. `3_gerar_word.js` — Montagem do documento Word (Node.js + docx)
Monta o `.docx` final, com todas as tabelas, textos e os 8 gráficos
inseridos como imagens. Usa a biblioteca `docx` (docx-js).

**Como rodar:**
```bash
npm install docx
node 3_gerar_word.js
```
> Importante: este script espera os PNGs gerados no passo 2 na mesma
> pasta (`chart1_municipios.png` até `chart8_correlacao.png`), e salva
> a saída em `/mnt/user-data/outputs/...` — troque esse caminho no
> final do arquivo (`fs.writeFileSync(...)`) para o caminho que você
> quiser no seu PC, ex: `./Relatorio_PRF_2025.docx`.

---

## Resumo do que cada tecnologia fez

| Etapa | Tecnologia | Papel |
|---|---|---|
| Ler e cruzar o CSV | **Python + pandas** | groupby, crosstab, correlação, filtros mínimos de volume |
| Gerar gráficos | **Python + matplotlib** | 8 imagens PNG (200 dpi) no estilo do modelo enviado |
| Montar o Word | **Node.js + docx (docx-js)** | Cabeçalhos, tabelas com zebra striping, cards de KPI, callout boxes, inserção de imagens, controle de quebra de página |

## Bibliotecas usadas
- `pandas` — manipulação e agregação dos dados
- `matplotlib` — geração dos gráficos
- `numpy` — usado dentro do script de gráficos (barra empilhada)
- `docx` (pacote npm, também chamado docx-js) — geração do arquivo .docx do zero
