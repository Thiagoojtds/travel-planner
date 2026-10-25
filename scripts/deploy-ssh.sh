#!/usr/bin/env bash
# Script para deploy direto via SSH/Rsync (opcional e rápido para desenvolvimento)
set -e

# Carrega variáveis ou solicita se não existirem
VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-}"
VPS_PORT="${VPS_PORT:-22}"
VPS_DIR="${VPS_TARGET_DIR:-/opt/transfrete-pro}"

if [ -z "$VPS_HOST" ]; then
  read -p "Digite o IP ou Host da VPS: " VPS_HOST
fi

if [ -z "$VPS_USER" ]; then
  read -p "Digite o usuário SSH (padrão: root): " VPS_USER
  VPS_USER=${VPS_USER:-root}
fi

echo "🚀 Sincronizando arquivos com a VPS ($VPS_USER@$VPS_HOST:$VPS_DIR)..."

# Garante que o diretório remoto exista
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "mkdir -p $VPS_DIR/data"

# Sincroniza arquivos excluindo o que não deve ir
rsync -avz -e "ssh -p $VPS_PORT" \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude="dist" \
  --exclude=".venv" \
  --exclude="data/*.db" \
  --exclude="data/*.db-journal" \
  --exclude="deploy.tar.gz" \
  ./ "$VPS_USER@$VPS_HOST:$VPS_DIR/"

echo "🐳 Subindo aplicação via Docker Compose na VPS..."
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "cd $VPS_DIR && docker compose up -d --build && docker image prune -f"

echo "✅ Deploy concluído com sucesso!"
