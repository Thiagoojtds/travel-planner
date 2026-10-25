# Guia de Deploy Automático na VPS - TransFrete Pro

Este projeto está configurado para deploy automático em VPS com Docker via **GitHub Actions** toda vez que houver um `git push` na branch `main`.

---

## 1. Secrets necessários no GitHub

No seu repositório no GitHub, acesse:
**Settings** > **Secrets and variables** > **Actions** > **New repository secret**

Adicione as 5 variáveis abaixo:

| Secret | Descrição | Exemplo |
| :--- | :--- | :--- |
| `VPS_HOST` | Endereço IP ou domínio da VPS | `192.0.2.1` ou `vps.meusite.com` |
| `VPS_USER` | Usuário de acesso SSH na VPS | `root` ou `ubuntu` |
| `VPS_SSH_KEY` | Conteúdo da chave SSH privada (conteúdo de `~/.ssh/id_ed25519` ou `id_rsa`) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_PORT` | Porta SSH da sua VPS (opcional, padrão 22) | `22` |
| `VPS_TARGET_DIR` | Pasta onde o projeto ficará na VPS | `/opt/transfrete-pro` |

---

## 2. Preparando a VPS (Executar uma única vez)

Na sua VPS via terminal:

1. **Garantir que Docker e Git estão instalados**:
   ```bash
   sudo apt update
   sudo apt install -y git docker.io docker-compose-plugin
   sudo systemctl enable --now docker
   ```

2. **Criar a pasta e o arquivo `.env` de produção**:
   ```bash
   mkdir -p /opt/transfrete-pro/data
   cd /opt/transfrete-pro
   nano .env
   ```
   *Exemplo de `.env` para colocar na VPS:*
   ```env
   PORT=8080
   PORT_BIND=80
   ENVIRONMENT=production
   DATABASE_URL="file:/app/data/app.db"
   SECRET_KEY=transfrete_secret_chave_producao_2026
   DEFAULT_ADMIN_PIN=2409
   ```

3. **Se seu repositório for PRIVADO no GitHub**:
   Para a VPS conseguir clonar/puxar as atualizações automaticamente, adicione uma **Deploy Key** (somente leitura) no GitHub:
   ```bash
   # Na VPS, gere uma chave para o repo (caso ainda não tenha):
   ssh-keygen -t ed25519 -C "vps-deploy" -f ~/.ssh/github_deploy -N ""
   cat ~/.ssh/github_deploy.pub
   ```
   Copie a chave pública e adicione no GitHub em:
   **Settings do Repositório** > **Deploy Keys** > **Add deploy key** (marcar somente leitura).

---

## 3. Como funciona o Deploy Automático

1. No seu computador local, faça commits e envie para o GitHub:
   ```bash
   git add .
   git commit -m "feat: novas funcionalidades"
   git push origin main
   ```
2. O **GitHub Actions** será disparado automaticamente.
3. Ele conecta na VPS por SSH, puxa a versão mais recente, executa o build do Docker e sobe o container com zero esforço manual!
4. O banco SQLite em `data/app.db` na VPS é preservado com persistência total em volume.

---

## 4. Alternativa rápida: Deploy direto pelo terminal

Se preferir fazer um deploy imediato direto do seu computador sem esperar o GitHub Actions:
```bash
./scripts/deploy-ssh.sh
```
O script usará `rsync` e SSH para enviar os arquivos e reiniciar os containers na VPS.
