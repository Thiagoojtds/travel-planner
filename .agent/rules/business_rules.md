# Regras de Negócio do Projeto

- **Caminhão Único**: Focado na operação do conjunto **Iveco Stralis Randon** (Cavalo BRA-2E19 / Semirreboque ABC-1D23).
- **Tanque Duplo**: 900 Litros de capacidade (600L Principal + 300L Auxiliar).
- **Manutenção Preventiva de Óleo**: Intervalo rigoroso de troca a cada 20.000 km.
- **Identificador de Fretes**: Gerado automaticamente em formato legível human-readable (ex: `FRT-CWB-SP-202610-01`).
- **Custo Fixo do Motorista**: R$ 700,00 por frete/viagem (configurável), debitado no lucro líquido real.
- **Entradas e Saldos de Frete**: Saldo padrão previsto para a segunda-feira posterior à data de finalização/entrega do frete.
- **Diesel como Despesa**: Abastecimentos vinculados à viagem para apuração de lucro líquido real por frete.
- **Dívidas & Financiamentos**: Controle de contratos com amortização de parcelas, saldo devedor e vencimento mensal.
- **Restante a Pagar**: Soma dinâmica de parcelas de dívidas pendentes e despesas fixas pendentes no mês corrente.
