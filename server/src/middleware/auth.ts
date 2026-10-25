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
  const providedPin = (req.headers['x-access-pin'] as string | undefined)?.trim();
  const isDemo = providedPin === DEMO_PIN;

  if (!providedPin) {
    return res.status(401).json({ error: 'PIN de acesso não fornecido.' });
  }

  // 1. Acesso com PIN 1234 -> Executa OBRIGATORIAMENTE isolado no banco demo.db (Dados Fictícios)
  if (isDemo) {
    (req as any).isDemo = true;
    return asyncLocalStorage.run({ isDemo: true }, () => next());
  }

  // 2. Acesso com PIN Real -> Executa no banco real de produção app.db
  const currentPin = await getStoredPin();
  if (providedPin === currentPin) {
    (req as any).isDemo = false;
    return asyncLocalStorage.run({ isDemo: false }, () => next());
  }

  return res.status(403).json({ error: 'PIN de acesso incorreto.' });
}
