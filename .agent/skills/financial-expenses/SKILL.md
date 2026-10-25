---
name: financial-expenses
description: >-
  Use esta skill para orientar o controle de despesas operacionais, abastecimentos de diesel,
  gastos fixos mensais (financiamento, seguro, sascar) e apuração do restante a pagar no mês.
---

# Habilidade: Gestão Financeira, Diesel e Contas a Pagar

## 1. Categorização de Gastos
- `combustivel`: Abastecimentos de Diesel S10 (litros, odômetro e valor/L).
- `prestacao_veiculo`: Financiamento mensal do cavalo mecânico Scania (ex: Banco Financiador R$ 3.800,00).
- `seguro`: Apólice de frota e carga (Porto Seguro Cargas).
- `taxas_impostos`: IPVA, Licenciamento, DAS Simples Nacional, Rastreador Sascar.
- `manutencao`: Peças, trocas de óleo, serviços de compressor e válvulas.
- `alimentacao_estadia`: Diárias e comissões do motorista Kennedy.
- `pedagio`: Despesas via Tag rodoviária ou adiantamentos.

## 2. Regras de Gastos Fixos Recorrentes
- Cadastro com dia de vencimento (`dueDay` de 1 a 31) e beneficiário.
- Botão "Lançar Gastos Fixos do Mês" projeta todas as contas do mês atual, marcando as vencidas como `pago` e as vincendas como `pendente`.

## 3. Apuração do "Restante a Pagar"
- Fórmula: Soma de todas as despesas (`type: 'saida'`) com status `pendente` ou `agendado`.
- Exibido com destaque visual âmbar e barra de quitação percentual (`percentPaid`).
