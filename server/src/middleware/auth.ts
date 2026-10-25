import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';

const DEFAULT_PIN = process.env.APP_PIN || '1234';

export async function getStoredPin(): Promise<string> {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { key: 'access_pin' }
    });
    return config ? config.value : DEFAULT_PIN;
  } catch {
    return DEFAULT_PIN;
  }
}

export async function setStoredPin(newPin: string): Promise<void> {
  await prisma.appConfig.upsert({
    where: { key: 'access_pin' },
    update: { value: newPin },
    create: { key: 'access_pin', value: newPin }
  });
}

export async function pinAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Ignora requisições que não sejam para a API (assets, páginas HTML, favicon, etc.)
  if (!req.path.startsWith('/api')) {
    return next();
  }

  // Endpoints públicos de autenticação e status
  if (req.path === '/api/auth/verify' || req.path === '/api/auth/status' || req.path === '/api/health') {
    return next();
  }

  const providedPin = req.headers['x-access-pin'] as string;
  if (!providedPin) {
    return res.status(401).json({ error: 'PIN de acesso não fornecido.' });
  }

  const currentPin = await getStoredPin();
  if (providedPin !== currentPin) {
    return res.status(403).json({ error: 'PIN de acesso incorreto.' });
  }

  next();
}
