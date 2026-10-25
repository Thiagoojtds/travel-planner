import { Router, Request, Response } from 'express';
import { getStoredPin, setStoredPin } from '../middleware/auth';

const router = Router();

// POST /api/auth/verify
router.post('/verify', async (req: Request, res: Response) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'PIN não informado' });
  }

  const storedPin = await getStoredPin();
  if (pin === storedPin) {
    return res.json({ success: true, message: 'Autenticado com sucesso' });
  } else {
    return res.status(401).json({ success: false, error: 'PIN incorreto' });
  }
});

// POST /api/auth/change-pin
router.post('/change-pin', async (req: Request, res: Response) => {
  const { currentPin, newPin } = req.body;
  const storedPin = await getStoredPin();

  if (currentPin !== storedPin) {
    return res.status(401).json({ error: 'PIN atual incorreto' });
  }

  if (!newPin || newPin.length < 4) {
    return res.status(400).json({ error: 'O novo PIN deve ter no mínimo 4 dígitos' });
  }

  await setStoredPin(newPin);
  res.json({ success: true, message: 'PIN alterado com sucesso' });
});

// GET /api/auth/status
router.get('/status', async (_req: Request, res: Response) => {
  const storedPin = await getStoredPin();
  res.json({ isDefaultPin: storedPin === '1234' });
});

export default router;
