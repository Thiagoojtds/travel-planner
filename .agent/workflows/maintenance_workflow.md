# Fluxo de Trabalho: Manutenção e Revisão Preventiva

1. **Alerta de Óleo**: Se o Scania rodar mais de 16.000 km desde a última troca, um banner de aviso surge no Dashboard sugerindo o agendamento.
2. **Cadastro da Manutenção**:
   - Tipo (preventiva ou corretiva), categoria (óleo, motor, freios, compressor, etc.), valor e oficina.
   - Se a manutenção for de óleo/filtros, o odômetro da última troca (`truck.lastOilChangeKm`) é atualizado automaticamente.
3. **Lançamento Financeiro**:
   - A despesa é lançada automaticamente em `expenses` como saída na categoria `manutencao`.
