---
name: dashboard-analytics
description: >-
  Use esta skill para estruturar a visão executiva do Dashboard, com agrupamento mensal,
  cálculo dinâmico do restante a pagar, filtros por fornecedor e gráficos de evolução.
---

# Habilidade: Dashboard Analítico e Agrupamento Mensal

## 1. Agrupamento Mensal
- Seletor rápido de mês no topo (Pills interativos): `Todos os Meses` e meses específicos (`YYYY-MM`).
- Demonstração visual de pendências com indicador âmbar em meses que possuem contas a pagar.
- Painel "Fechamento Mensal Consolidado": Grade de cartões comparando mês a mês Faturamento, Gastos Pagos, **Restante a Pagar** e Saldo Líquido.

## 2. Filtros Dinâmicos
- **Fornecedor**: Filtra saídas por `stationVendor` e entradas/fretes por `client`.
- **Intervalo de Datas**: Inputs De e Até com recálculo instantâneo de todos os KPIs.
- Botão "Limpar Filtros" para restauração rápida do estado global.

## 3. Gráficos em SVG Puro
- `FinancialEvolutionChart`: 4 barras por mês (Faturamento, Despesas Pagas, Restante a Pagar e Lucro Líquido), com evento de clique para filtrar o mês no dashboard.
- `ExpenseDistributionDonut`: Gráfico de rosca dinâmico mostrando a fatia percentual de cada categoria no período selecionado.
