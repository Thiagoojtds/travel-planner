---
name: truck-maintenance
description: >-
  Use esta skill para gerenciar a manutenção preventiva e corretiva do caminhão Scania R 450,
  controle de odômetro, intervalo de troca de óleo de 20.000 km e checklist diário.
---

# Habilidade: Manutenção Mecânica e Checklist

## 1. Especificações do Veículo
- **Modelo**: Iveco Stralis 6x2 (Ano 2018)
- **Placa**: BRA-2E19
- **Motorista Oficial**: Motorista Principal
- **Capacidade do Tanque**: 900 Litros (600L + 300L)
- **Consumo Médio Real**: 2.20 km/L (Carregado com 28t)

## 2. Monitoramento de Troca de Óleo
- Intervalo programado: **20.000 km**.
- Odômetro registrado na última troca: `truck.lastOilChangeKm`.
- Alerta Amarelo (`warning`): $\ge 80\%$ do intervalo atingido.
- Alerta Crítico Vermelho (`critical`): $\ge 100\%$ ou menos de 1.000 km restantes.

## 3. Integração Automática de Gastos
- Toda manutenção salva cria automaticamente uma despesa correspondente (`type: 'saida'`, `category: 'manutencao'`) com a oficina como fornecedor.
