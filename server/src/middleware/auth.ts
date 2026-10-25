import { Request, Response, NextFunction } from 'express';
import { prismaProd, asyncLocalStorage } from '../db';

export const DEMO_PIN = '1234';
const DEFAULT_PROD_PIN = process.env.APP_PIN || '2703';

export async function getStoredPin(): Promise<string> {
  try {
    const config = await prismaProd.appConfig.findUnique({
      where: { key: 'access_pin' }
    });
    return config ? config.value : DEFAULT_PROD_PIN;
  } catch {
    return DEFAULT_PROD_PIN;
  }
}

export async function setStoredPin(newPin: string): Promise<void> {
  await prismaProd.appConfig.upsert({
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

  const providedPin = req.headers['x-access-pin'] as string;
  const isDemo = providedPin === DEMO_PIN;

  // Endpoints públicos de autenticação e status
  if (req.path === '/api/auth/verify' || req.path === '/api/auth/status' || req.path === '/api/health') {
    return asyncLocalStorage.run({ isDemo }, () => next());
  }

  if (!providedPin) {
    return res.status(401).json({ error: 'PIN de acesso não fornecido.' });
  }

  // Acesso permitido via PIN de Teste (1234) - Executa sob contexto demo.db
  if (isDemo) {
    (req as any).isDemo = true;
    return asyncLocalStorage.run({ isDemo: true }, () => next());
  }

  // Acesso permitido via PIN Real (ex: 2703) - Executa sob contexto app.db
  const currentPin = await getStoredPin();
  if (providedPin === currentPin) {
    (req as any).isDemo = false;
    return asyncLocalStorage.run({ isDemo: false }, () => next());
  }

  return res.status(403).json({ error: 'PIN de acesso incorreto.' });
}
