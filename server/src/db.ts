import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';
import { ensureDemoDatabase } from './demoSeed';

export const asyncLocalStorage = new AsyncLocalStorage<{ isDemo: boolean }>();

export const prismaProd = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../data/app.db',
    },
  },
});

export const prismaDemo = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../data/demo.db',
    },
  },
});

// Proxy dinâmico que encaminha as chamadas do Prisma para prismaDemo ou prismaProd conforme o contexto da requisição
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const store = asyncLocalStorage.getStore();
    const client = store?.isDemo ? prismaDemo : prismaProd;
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

// Inicializa o banco de dados de demonstração em segundo plano se ainda não existir
ensureDemoDatabase(prismaProd, prismaDemo).catch(err => {
  console.error('Falha ao inicializar demo.db:', err);
});
