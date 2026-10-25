import { Router, Request, Response } from 'express';
import { getStoredPin, setStoredPin, DEMO_PIN } from '../middleware/auth';

const router = Router();

// POST /api/auth/verify
router.post('/verify', async (req: Request, res: Response) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'PIN não informado' });
  }

  // 1. PIN de Teste / Demonstração (Portfólio)
  if (pin === DEMO_PIN) {
    return res.json({
      success: true,
      mode: 'demo',
      message: 'Acesso concedido ao Modo Demonstração (Portfólio)',
    });
  }

  // 2. PIN Real de Produção (ex: 2703)
  const storedPin = await getStoredPin();
  if (pin === storedPin) {
    return res.json({
      success: true,
      mode: 'production',
      message: 'Acesso concedido ao Modo Produção',
    });
  }

  return res.status(401).json({ success: false, error: 'PIN incorreto' });
});

// POST /api/auth/change-pin
router.post('/change-pin', async (req: Request, res: Response) => {
  const providedPin = req.headers['x-access-pin'] as string;
  if (providedPin === DEMO_PIN) {
    return res.status(403).json({ error: 'Não é permitido alterar o PIN no Modo Demonstração.' });
  }

  const { currentPin, newPin } = req.body;
  const storedPin = await getStoredPin();

  if (currentPin !== storedPin) {
    return res.status(401).json({ error: 'PIN atual incorreto' });
  }

  if (!newPin || newPin.length < 4) {
    return res.status(400).json({ error: 'O novo PIN deve ter no mínimo 4 dígitos' });
  }

  if (newPin === DEMO_PIN) {
    return res.status(400).json({ error: 'O PIN 1234 é reservado para o acesso de teste.' });
  }

  await setStoredPin(newPin);
  res.json({ success: true, message: 'PIN alterado com sucesso' });
});

// GET /api/auth/status
router.get('/status', async (_req: Request, res: Response) => {
  const storedPin = await getStoredPin();
  res.json({
    isDefaultPin: storedPin === '2703' || storedPin === '1234',
    demoPinAvailable: true,
  });
});

export default router;
