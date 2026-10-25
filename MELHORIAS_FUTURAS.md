# 🚀 Melhorias Futuras e Backlog de Evoluções

Documento de registro e priorização de ideias, melhorias e novas funcionalidades planejadas para o sistema de gestão de viagens e fretes.

---

## 📋 Lista de Melhorias

### 1. Preenchimento Automático de Abastecimento via Foto de Nota/Cupom do Posto
- **Status**: 📝 Planejado / Em concepção
- **Módulo**: Financeiro & Despesas ([`financial-expenses`](file:///home/thiago/Projects/travel-planner/.agent/skills/financial-expenses/SKILL.md)) / Abastecimentos
- **Prioridade**: Média-Alta

#### 🎯 Objetivo
Permitir que o motorista ou operador tire uma foto (ou faça upload) da nota/cupom fiscal emitido pelo posto de combustível (NFC-e ou comprovante de abastecimento) e o sistema preencha automaticamente os campos do formulário de abastecimento, minimizando digitação manual e erros.

#### 🔍 Dados a serem extraídos
- **Nome/Razão Social do Posto** (e/ou CNPJ)
- **Data e Hora** do abastecimento
- **Tipo de Combustível** (ex: Diesel S10, S500, Arla 32)
- **Quantidade de Litros**
- **Valor Unitário (R$/L)**
- **Valor Total Pago (R$)**
- **Forma de Pagamento** (opcional, quando disponível no cupom)
- **Odômetro (KM)** (caso anotado manualmente ou impresso pelo posto)

#### 🛠️ Abordagens Técnicas Sugeridas
1. **OCR / Visão Computacional com IA (Recomendado)**:
   - Uso de modelo multimodal (ex: Gemini Vision API / Google Cloud Document AI) para envio da imagem em base64 e extração dos campos estruturados em JSON.
2. **Leitura do QR Code da NFC-e (Alternativa complementar)**:
   - Leitura do QR Code presente no cupom fiscal para consultar diretamente os dados da NFC-e no portal da SEFAZ estadual.
3. **Fluxo de Interface (UX/UI)**:
   - Botão "Capturar / Ler Nota" no modal de cadastro de abastecimento.
   - Suporte a câmera do dispositivo móvel (`capture="environment"` no input de arquivo) e arrastar/soltar no desktop.
   - Tela de conferência prévia: exibe os campos pré-preenchidos para revisão e ajuste manual antes da gravação final.

---

## 📌 Template para Novas Entradas

Para adicionar novas melhorias a este documento, siga o padrão:

```markdown
### [Número]. [Título da Melhoria]
- **Status**: 📝 Planejado | ⏳ Em Progresso | ✅ Concluído | ⏸️ Em Espera
- **Módulo**: [Fretes | Financeiro | Manutenção | Dashboard | Configurações]
- **Prioridade**: Baixa | Média | Alta | Crítica

#### 🎯 Objetivo
[Descrição suscinta da dor que resolve e o resultado esperado]

#### 🔍 Requisitos e Detalhes
- [Item 1]
- [Item 2]

#### 🛠️ Abordagens Técnicas Sugeridas
- [Tecnologias, endpoints ou componentes envolvidos]
```
