FROM node:20-alpine

# Necessário para o Prisma Client no Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalação de dependências
RUN npm install

# Copiar restante do código da aplicação
COPY . .

# Build do frontend React Vite e geração do Prisma Client
RUN npm run build

# Criar pasta para volume persistente
RUN mkdir -p /app/data

ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 8080

# Ao subir o container: sincroniza o schema do Prisma com o SQLite e inicia o servidor Express
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run start"]
