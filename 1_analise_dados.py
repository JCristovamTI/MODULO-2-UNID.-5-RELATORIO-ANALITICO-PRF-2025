"""
ANÁLISE EXPLORATÓRIA - DADOS ABERTOS PRF 2025
Este script lê o CSV da PRF e calcula todos os indicadores,
rankings e cruzamentos usados no relatório.

Requisitos: pip install pandas --break-system-packages
"""
import pandas as pd
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 200)

# ---------- 1. Carregar dados ----------
# O CSV da PRF usa separador ; e encoding latin1 (ISO-8859-1)
CSV_PATH = 'dados_abertos_prf-datatran2025.csv'
df = pd.read_csv(CSV_PATH, sep=';', encoding='latin1')

# Coluna auxiliar: acidente teve pelo menos 1 morto? (variável-alvo binária)
df['fatal'] = (df['mortos'] > 0).astype(int)

# Datas e recortes temporais
df['data_inversa'] = pd.to_datetime(df['data_inversa'], format='%d/%m/%Y')
df['mes'] = df['data_inversa'].dt.month
df['hora'] = df['horario'].str.split(':').str[0].astype(int)

def turno(h):
    if 0 <= h < 6:  return 'Madrugada'
    if 6 <= h < 12: return 'Manhã'
    if 12 <= h < 18: return 'Tarde'
    return 'Noite'
df['turno'] = df['hora'].apply(turno)

TAXA_GLOBAL = df['fatal'].mean() * 100

# ---------- 2. Indicadores globais ----------
print("="*60)
print("INDICADORES GLOBAIS")
print("="*60)
print("Total de registros:", len(df))
print("Total de mortos:", df['mortos'].sum())
print("Acidentes com >=1 morto:", df['fatal'].sum(),
      f"({TAXA_GLOBAL:.2f}%)")
print("Taxa de mortos por 100 acidentes:", df['mortos'].sum()/len(df)*100)
print("Total feridos graves:", df['feridos_graves'].sum())
print("Total feridos leves:", df['feridos_leves'].sum())
print("Total pessoas envolvidas:", df['pessoas'].sum())
print("Total veículos:", df['veiculos'].sum())
print("Média pessoas por acidente:", df['pessoas'].mean())
print("Mediana mortos:", df['mortos'].median())

# ---------- 3. Ranking por UF ----------
print("\n" + "="*60)
print("RANKING POR UF (top 15 por volume)")
print("="*60)
uf = df.groupby('uf').agg(
    registros=('id', 'count'),
    mortos=('mortos', 'sum'),
    fatal_pct=('fatal', 'mean')
).reset_index()
uf['fatal_pct'] *= 100
print(uf.sort_values('registros', ascending=False).head(15))

# ---------- 4. Ranking por rodovia (BR) ----------
print("\n" + "="*60)
print("RANKING POR RODOVIA - maior volume")
print("="*60)
br = df.groupby('br').agg(
    registros=('id', 'count'),
    fatal_pct=('fatal', 'mean')
).reset_index()
br['fatal_pct'] *= 100
print(br.sort_values('registros', ascending=False).head(10))

print("\nRANKING POR RODOVIA - maior letalidade (mín. 150 registros)")
br_min = br[br['registros'] >= 150].sort_values('fatal_pct', ascending=False)
print(br_min.head(10))

# ---------- 5. Ranking por município ----------
print("\n" + "="*60)
print("TOP 10 MUNICÍPIOS POR VOLUME")
print("="*60)
mv = df.groupby('municipio').agg(registros=('id', 'count')).reset_index()
print(mv.sort_values('registros', ascending=False).head(10))

print("\nTOP 10 MUNICÍPIOS POR LETALIDADE (mín. 80 registros)")
mf = df.groupby('municipio').agg(
    registros=('id', 'count'),
    fatal_pct=('fatal', 'mean')
).reset_index()
mf['fatal_pct'] *= 100
mf = mf[mf['registros'] >= 80].sort_values('fatal_pct', ascending=False)
print(mf.head(10))

# ---------- 6. Série mensal ----------
print("\n" + "="*60)
print("SÉRIE MENSAL")
print("="*60)
mm = df.groupby('mes').agg(
    registros=('id', 'count'),
    fatal_pct=('fatal', 'mean')
).reset_index()
mm['fatal_pct'] *= 100
print(mm)

# ---------- 7. Por turno ----------
print("\n" + "="*60)
print("POR TURNO DO DIA")
print("="*60)
tu = df.groupby('turno').agg(
    registros=('id', 'count'),
    mortos=('mortos', 'sum'),
    fatal_pct=('fatal', 'mean')
).reset_index()
tu['fatal_pct'] *= 100
print(tu)

# ---------- 8. Tipo de acidente ----------
print("\n" + "="*60)
print("POR TIPO DE ACIDENTE")
print("="*60)
ta = df.groupby('tipo_acidente').agg(
    registros=('id', 'count'),
    mortos=('mortos', 'sum'),
    fatal_pct=('fatal', 'mean')
).reset_index()
ta['fatal_pct'] *= 100
print(ta.sort_values('registros', ascending=False))

# ---------- 9. Causa do acidente (mín. 1000 registros) ----------
print("\n" + "="*60)
print("POR CAUSA DO ACIDENTE (mín. 1.000 registros)")
print("="*60)
ca = df.groupby('causa_acidente').agg(
    registros=('id', 'count'),
    mortos=('mortos', 'sum'),
    fatal_pct=('fatal', 'mean')
).reset_index()
ca['fatal_pct'] *= 100
ca = ca[ca['registros'] >= 1000].sort_values('fatal_pct', ascending=False)
print(ca)

# ---------- 10. Condição meteorológica ----------
print("\n" + "="*60)
print("POR CONDIÇÃO METEOROLÓGICA (mín. 100 registros)")
print("="*60)
cm = df.groupby('condicao_metereologica').agg(
    registros=('id', 'count'),
    fatal_pct=('fatal', 'mean')
).reset_index()
cm['fatal_pct'] *= 100
cm = cm[cm['registros'] >= 100].sort_values('fatal_pct', ascending=False)
print(cm)

# ---------- 11. Tipo de pista / uso do solo ----------
print("\n" + "="*60)
print("TIPO DE PISTA E USO DO SOLO")
print("="*60)
tp = df.groupby('tipo_pista').agg(
    registros=('id', 'count'),
    fatal_pct=('fatal', 'mean')
).reset_index()
tp['fatal_pct'] *= 100
print(tp)

us = df.groupby('uso_solo').agg(
    registros=('id', 'count'),
    fatal_pct=('fatal', 'mean')
).reset_index()
us['fatal_pct'] *= 100
print(us)

# ---------- 12. Heatmap: tipo_pista x fase_dia ----------
print("\n" + "="*60)
print("CRUZAMENTO: TIPO DE PISTA x FASE DO DIA (% fatal)")
print("="*60)
ct = pd.crosstab(df['tipo_pista'], df['fase_dia'],
                  values=df['fatal'], aggfunc='mean') * 100
print(ct)

# ---------- 13. Combinações de fatores (mín. 200 registros) ----------
print("\n" + "="*60)
print("COMBO: CAUSA x FASE DO DIA (mín. 200 registros)")
print("="*60)
combo1 = df.groupby(['causa_acidente', 'fase_dia']).agg(
    registros=('id', 'count'),
    fatal_pct=('fatal', 'mean')
).reset_index()
combo1['fatal_pct'] *= 100
combo1 = combo1[combo1['registros'] >= 200].sort_values('fatal_pct', ascending=False)
print(combo1.head(10))

print("\nCOMBO: TIPO DE PISTA x TURNO (mín. 200 registros)")
combo2 = df.groupby(['tipo_pista', 'turno']).agg(
    registros=('id', 'count'),
    fatal_pct=('fatal', 'mean')
).reset_index()
combo2['fatal_pct'] *= 100
combo2 = combo2[combo2['registros'] >= 200].sort_values('fatal_pct', ascending=False)
print(combo2.head(10))

# ---------- 14. Matriz de correlação ----------
print("\n" + "="*60)
print("MATRIZ DE CORRELAÇÃO (variáveis numéricas)")
print("="*60)
num_cols = ['pessoas', 'mortos', 'feridos_leves', 'feridos_graves', 'ilesos', 'veiculos']
print(df[num_cols].corr())
