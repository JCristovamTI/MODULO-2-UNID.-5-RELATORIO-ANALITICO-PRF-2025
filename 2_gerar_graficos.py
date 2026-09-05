"""
GERAÇÃO DOS 8 GRÁFICOS DO RELATÓRIO
Usa matplotlib para criar gráficos no mesmo estilo visual
do modelo (cores, dashed line de referência, layout lado a lado).

Requisitos: pip install pandas matplotlib --break-system-packages
Saída: pasta ./charts/ com 8 arquivos PNG em alta resolução (200 dpi)
"""
import os
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # renderiza sem precisar de display gráfico
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['axes.spines.top'] = False
plt.rcParams['axes.spines.right'] = False

# Paleta de cores usada em todos os gráficos
BLUE = '#4C72B0'
RED = '#C44E52'
GREEN = '#55A868'
GOLD = '#DBB446'
CMAP = 'Blues'

os.makedirs('charts', exist_ok=True)

# ---------- Carregar e preparar dados ----------
df = pd.read_csv('dados_abertos_prf-datatran2025.csv', sep=';', encoding='latin1')
df['fatal'] = (df['mortos'] > 0).astype(int)
df['data_inversa'] = pd.to_datetime(df['data_inversa'], format='%d/%m/%Y')
df['mes'] = df['data_inversa'].dt.month
df['hora'] = df['horario'].str.split(':').str[0].astype(int)

TAXA_GLOBAL = df['fatal'].mean() * 100

def turno(h):
    if 0 <= h < 6:  return 'Madrugada\n(00-06h)'
    if 6 <= h < 12: return 'Manhã\n(06-12h)'
    if 12 <= h < 18: return 'Tarde\n(12-18h)'
    return 'Noite\n(18-24h)'
df['turno'] = df['hora'].apply(turno)

# ============ GRÁFICO 1: Top10 municípios volume | top10 fatal% ============
mv = (df.groupby('municipio').agg(registros=('id', 'count')).reset_index()
        .sort_values('registros', ascending=False).head(10).sort_values('registros'))
mf = df.groupby('municipio').agg(registros=('id', 'count'), fatal_pct=('fatal', 'mean')).reset_index()
mf['fatal_pct'] *= 100
mf = mf[mf['registros'] >= 80].sort_values('fatal_pct', ascending=False).head(10).sort_values('fatal_pct')

fig, axes = plt.subplots(1, 2, figsize=(13.5, 5.2))
axes[0].barh(mv['municipio'].str.title(), mv['registros'], color=BLUE)
axes[0].set_title('Top 10 municípios por volume de acidentes', fontsize=12)
axes[0].set_xlabel('Acidentes registrados')

axes[1].barh(mf['municipio'].str.title(), mf['fatal_pct'], color=RED)
axes[1].axvline(TAXA_GLOBAL, color='black', linestyle='--', linewidth=1.2,
                 label=f'Taxa global ({TAXA_GLOBAL:.1f}%)')
axes[1].set_title('% de acidentes com vítima fatal\n(municípios com ≥80 registros)', fontsize=12)
axes[1].set_xlabel('% com vítima fatal')
axes[1].legend(loc='lower right', fontsize=9)
plt.tight_layout()
plt.savefig('charts/chart1_municipios.png', dpi=200, bbox_inches='tight')
plt.close()

# ============ GRÁFICO 2: Série mensal - volume | % alvo ============
mm = df.groupby('mes').agg(registros=('id', 'count'), fatal_pct=('fatal', 'mean')).reset_index()
mm['fatal_pct'] *= 100
meses_lbl = [f'{m:02d}' for m in mm['mes']]

fig, axes = plt.subplots(1, 2, figsize=(13.5, 4.6))
axes[0].plot(meses_lbl, mm['registros'], marker='o', color=BLUE, linewidth=2)
axes[0].set_title('Volume mensal de acidentes — 2025', fontsize=12)
axes[0].set_xlabel('Mês')
axes[0].tick_params(axis='x', rotation=45)

axes[1].plot(meses_lbl, mm['fatal_pct'], marker='o', color=RED, linewidth=2)
axes[1].axhline(TAXA_GLOBAL, color='black', linestyle='--', linewidth=1.2,
                 label=f'Taxa global ({TAXA_GLOBAL:.1f}%)')
axes[1].set_title('% de acidentes com vítima fatal por mês — 2025', fontsize=12)
axes[1].set_xlabel('Mês')
axes[1].tick_params(axis='x', rotation=45)
axes[1].legend(loc='upper left', fontsize=9)
plt.tight_layout()
plt.savefig('charts/chart2_mensal.png', dpi=200, bbox_inches='tight')
plt.close()

# ============ GRÁFICO 3: Volume por turno | % alvo por turno ============
tu = df.groupby('turno').agg(registros=('id', 'count'), fatal_pct=('fatal', 'mean')).reset_index()
tu['fatal_pct'] *= 100
order = ['Madrugada\n(00-06h)', 'Manhã\n(06-12h)', 'Tarde\n(12-18h)', 'Noite\n(18-24h)']
tu['turno'] = pd.Categorical(tu['turno'], categories=order, ordered=True)
tu = tu.sort_values('turno')

fig, axes = plt.subplots(1, 2, figsize=(13.5, 4.6))
axes[0].bar(tu['turno'], tu['registros'], color=BLUE)
axes[0].set_title('Volume de acidentes por turno', fontsize=12)
axes[0].set_ylabel('Acidentes registrados')

axes[1].bar(tu['turno'], tu['fatal_pct'], color=RED)
axes[1].axhline(TAXA_GLOBAL, color='black', linestyle='--', linewidth=1.2,
                 label=f'Taxa global ({TAXA_GLOBAL:.1f}%)')
axes[1].set_title('% de acidentes com vítima fatal por turno', fontsize=12)
axes[1].set_ylabel('% com vítima fatal')
axes[1].legend(loc='upper right', fontsize=9)
plt.tight_layout()
plt.savefig('charts/chart3_turno.png', dpi=200, bbox_inches='tight')
plt.close()

# ============ GRÁFICO 4: Barra 100% empilhada - composição por tipo_acidente ============
top8 = df['tipo_acidente'].value_counts().head(8).index.tolist()
sub = df[df['tipo_acidente'].isin(top8)]
ct = pd.crosstab(sub['tipo_acidente'], sub['classificacao_acidente'], normalize='index') * 100
ct = ct[['Sem Vítimas', 'Com Vítimas Feridas', 'Com Vítimas Fatais']]
ct = ct.sort_values('Com Vítimas Fatais', ascending=True)

fig, ax = plt.subplots(figsize=(13, 5.2))
left = np.zeros(len(ct))
colors_map = {'Sem Vítimas': GREEN, 'Com Vítimas Feridas': GOLD, 'Com Vítimas Fatais': RED}
for col in ct.columns:
    ax.barh(ct.index, ct[col], left=left, color=colors_map[col], label=col)
    left += ct[col].values
ax.set_xlabel('%')
ax.set_title('Composição por desfecho nos tipos de acidente mais frequentes', fontsize=12)
ax.set_xlim(0, 100)
ax.legend(loc='upper center', bbox_to_anchor=(0.5, -0.12), ncol=3, fontsize=10, frameon=False)
plt.tight_layout()
plt.savefig('charts/chart4_composicao.png', dpi=200, bbox_inches='tight')
plt.close()

# ============ GRÁFICO 5: % alvo por causa (mín. 1000, top 12) ============
ca = df.groupby('causa_acidente').agg(registros=('id', 'count'), fatal_pct=('fatal', 'mean')).reset_index()
ca['fatal_pct'] *= 100
ca = ca[ca['registros'] >= 1000].sort_values('fatal_pct', ascending=False).head(12).sort_values('fatal_pct')

fig, ax = plt.subplots(figsize=(11, 6))
ax.barh(ca['causa_acidente'], ca['fatal_pct'], color=RED)
ax.axvline(TAXA_GLOBAL, color='black', linestyle='--', linewidth=1.2,
           label=f'Taxa global ({TAXA_GLOBAL:.1f}%)')
ax.set_xlabel('% de acidentes com vítima fatal')
ax.set_title('Top 12 causas mais letais (causas com ≥1.000 registros)', fontsize=12)
ax.legend(loc='lower right', fontsize=9)
plt.tight_layout()
plt.savefig('charts/chart5_causas.png', dpi=200, bbox_inches='tight')
plt.close()

# ============ GRÁFICO 6: % alvo condicao_metereologica | turno ============
cm = df.groupby('condicao_metereologica').agg(registros=('id', 'count'), fatal_pct=('fatal', 'mean')).reset_index()
cm['fatal_pct'] *= 100
cm = cm[cm['registros'] >= 100].sort_values('fatal_pct', ascending=False)

fig, axes = plt.subplots(1, 2, figsize=(13.5, 4.8))
axes[0].bar(cm['condicao_metereologica'], cm['fatal_pct'], color=BLUE)
axes[0].axhline(TAXA_GLOBAL, color='black', linestyle='--', linewidth=1.2,
                 label=f'Taxa global ({TAXA_GLOBAL:.1f}%)')
axes[0].set_title('% de vítima fatal por condição meteorológica', fontsize=12)
axes[0].set_ylabel('% com vítima fatal')
axes[0].tick_params(axis='x', rotation=35)
axes[0].legend(loc='upper right', fontsize=8)

axes[1].bar(tu['turno'], tu['fatal_pct'], color=RED)
axes[1].axhline(TAXA_GLOBAL, color='black', linestyle='--', linewidth=1.2,
                 label=f'Taxa global ({TAXA_GLOBAL:.1f}%)')
axes[1].set_title('% de vítima fatal por turno', fontsize=12)
axes[1].set_ylabel('% com vítima fatal')
axes[1].legend(loc='upper right', fontsize=9)
plt.tight_layout()
plt.savefig('charts/chart6_condicao_turno.png', dpi=200, bbox_inches='tight')
plt.close()

# ============ GRÁFICO 7: Heatmap tipo_pista x fase_dia ============
ct2 = pd.crosstab(df['tipo_pista'], df['fase_dia'], values=df['fatal'], aggfunc='mean') * 100
ct2 = ct2[['Amanhecer', 'Pleno dia', 'Anoitecer', 'Plena Noite']]

fig, ax = plt.subplots(figsize=(11, 4.2))
im = ax.imshow(ct2.values, cmap=CMAP, aspect='auto')
ax.set_xticks(range(len(ct2.columns))); ax.set_xticklabels(ct2.columns)
ax.set_yticks(range(len(ct2.index))); ax.set_yticklabels(ct2.index)
for i in range(ct2.shape[0]):
    for j in range(ct2.shape[1]):
        val = ct2.values[i, j]
        color = 'white' if val > ct2.values.max() * 0.6 else 'black'
        ax.text(j, i, f'{val:.1f}%', ha='center', va='center', color=color, fontsize=11)
cbar = plt.colorbar(im, ax=ax)
cbar.set_label('% do indicador-alvo')
ax.set_title('% de acidentes com vítima fatal por Tipo de Pista x Fase do Dia', fontsize=12)
plt.tight_layout()
plt.savefig('charts/chart7_heatmap.png', dpi=200, bbox_inches='tight')
plt.close()

# ============ GRÁFICO 8: Matriz de correlação ============
num_cols = ['pessoas', 'mortos', 'feridos_leves', 'feridos_graves', 'ilesos', 'veiculos']
labels = ['Pessoas', 'Mortos', 'Feridos leves', 'Feridos graves', 'Ilesos', 'Veículos']
corr = df[num_cols].corr()
corr.index = labels; corr.columns = labels

fig, ax = plt.subplots(figsize=(8.5, 6.5))
im = ax.imshow(corr.values, cmap='RdBu_r', vmin=-1, vmax=1, aspect='auto')
ax.set_xticks(range(len(labels))); ax.set_xticklabels(labels, rotation=35, ha='right')
ax.set_yticks(range(len(labels))); ax.set_yticklabels(labels)
for i in range(len(labels)):
    for j in range(len(labels)):
        val = corr.values[i, j]
        color = 'white' if abs(val) > 0.6 else 'black'
        ax.text(j, i, f'{val:.2f}', ha='center', va='center', color=color, fontsize=10)
cbar = plt.colorbar(im, ax=ax)
cbar.set_label('Correlação de Pearson')
ax.set_title('Matriz de correlação — variáveis numéricas', fontsize=12)
plt.tight_layout()
plt.savefig('charts/chart8_correlacao.png', dpi=200, bbox_inches='tight')
plt.close()

print("Todos os 8 gráficos foram gerados na pasta ./charts/")
