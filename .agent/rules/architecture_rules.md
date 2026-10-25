# Regras de Arquitetura

- Framework: React 18 + TypeScript + Vite 5.
- Estado Centralizado: AppContext.tsx com persistência em localStorage.
- Checagem Contínua: Manter sempre zero erros em `tsc --noEmit`.
- Comandos WSL: O terminal de desenvolvimento roda no WSL pelo usuário. Não executar comandos de sistema bloqueados.
