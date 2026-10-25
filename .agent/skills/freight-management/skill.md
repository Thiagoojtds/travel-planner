---
name: freight-management
description: >-
  Use esta skill para orientar a criação, cálculo, simulação e ciclo de vida de fretes, rotas
  e sincronização automática de entradas financeiras com prazo padrão de 7 dias úteis.
---

# Habilidade: Gestão e Simulação de Fretes

## 1. Regras de Negócio de Fretes
- **Entrada Financeira Automática**: Todo frete cadastrado gera imediatamente um lançamento de entrada (`type: 'entrada'`, `category: 'frete'`) no módulo financeiro.
- **Data de Vencimento Padrão**: A data de entrada financeira é calculada adicionando **7 dias úteis** após a data de descarga (`deliveryDate`) ou saída (`departureDate`), usando a função `addBusinessDays`.
- **Status do Frete**:
  - `planejado`: Viagem agendada.
  - `em_transito`: Viagem em andamento. Gera alerta visual no topo do Dashboard.
  - `finalizado`: Viagem concluída. Ao finalizar, quita o saldo devedor e marca a entrada financeira como `recebido`.
  - `cancelado`: Exclui do cômputo de faturamento.

## 2. Simulador de Frete
- Rota de ida e retorno vazio com Scania R 450 (Consumo padrão: 2.15 km/L carga cheia, 2.70 km/L vazio).
- Cálculo de combustível + pedágios + diárias do motorista + depreciação por km.
- Sugestão de valor com base na margem de lucro desejada (ex: 25% a 35%).
- Botão "Gerar Frete a Partir da Simulação" pré-preenche o modal de frete com código sequencial.
