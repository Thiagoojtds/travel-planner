# Fluxo de Trabalho: Cadastro de Novo Frete

1. **Abertura do Formulário**: O usuário abre o modal de frete via botão "+ Novo Frete" ou a partir da simulação.
2. **Definição de Rotas e Valores**:
   - Origem, Destino, Cliente, Carga, Peso (t) e Km.
   - Valor Bruto, Adiantamento e Saldo Devedor.
   - Data de Saída e Previsão de Entrega.
3. **Cálculo da Data de Entrada**:
   - Por padrão, a data de entrada financeira é calculada para a segunda-feira posterior à data de entrega (`getNextMonday`).
4. **Persistência**:
   - Salva o frete na lista `freights`.
   - Gera automaticamente a entrada financeira vinculada na lista `expenses` com status `agendado` (ou `recebido` se já entregue).
5. **Atualização do Dashboard**:
   - O Faturamento e o Saldo a Receber do mês correspondente são atualizados em tempo real.
