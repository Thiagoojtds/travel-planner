---
name: code-standards
description: >-
  Use esta skill para assegurar as diretrizes de código, UI/UX, glassmorphism,
  responsividade sem quebra de linhas e consistência de formulários.
---

# Habilidade: Padrões de Código e UI/UX

## 1. Diretrizes Técnicas
- **Stack**: React 18 + TypeScript + Vite 5.
- **CSS**: Vanilla CSS puro centralizado em `src/styles/index.css` com variáveis e glassmorphism. Não utilizar TailwindCSS.
- **Tipagem**: Manter `tsc --noEmit` sempre com **0 erros**.

## 2. Regras Críticas de UX
- **Retenção de Rascunho em Modais**: Ao clicar fora de um modal (no backdrop), o formulário fecha MAS os dados digitados permanecem salvos em estado de rascunho para não forçar o usuário a digitar tudo novamente.
- **Reset no Envio**: Ao submeter o formulário com sucesso, os campos são resetados para o próximo cadastro.
- **Espaçamentos e Tabelas**: Utilizar `white-space: nowrap` e alinhamentos horizontais com `gap` e `inline-flex` para que números, rotas e valores monetários nunca quebrem linha feia nas tabelas.
