import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
  failures: number;
  blockedUntil: number;
  lastAttempt: number;
}

const attemptsByIp = new Map<string, AttemptRecord>();
const MAX_FAILURES = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos de bloqueio temporário
const WINDOW_DURATION_MS = 15 * 60 * 1000; // Janela de avaliação

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Middleware que verifica se o IP do cliente está temporariamente bloqueado por excesso de tentativas incorretas.
 */
export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = attemptsByIp.get(ip);

  if (record && record.blockedUntil > now) {
    const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    return res.status(429).json({
      error: `Acesso bloqueado por segurança devido a tentativas incorretas consecutivas. Tente novamente em ${remainingMinutes} minuto(s).`,
      retryAfter: remainingSeconds,
    });
  }

  next();
}

/**
 * Registra uma tentativa com PIN incorreto e bloqueia se atingir o limite.
 */
export function recordFailedAttempt(req: Request): { blocked: boolean; remainingAttempts: number; remainingMinutes?: number } {
  const ip = getClientIp(req);
  const now = Date.now();
  let record = attemptsByIp.get(ip);

  if (!record || now - record.lastAttempt > WINDOW_DURATION_MS) {
    record = { failures: 1, blockedUntil: 0, lastAttempt: now };
  } else {
    record.failures += 1;
    record.lastAttempt = now;
  }

  if (record.failures >= MAX_FAILURES) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    attemptsByIp.set(ip, record);
    return {
      blocked: true,
      remainingAttempts: 0,
      remainingMinutes: Math.ceil(BLOCK_DURATION_MS / 60000),
    };
  }

  attemptsByIp.set(ip, record);
  return {
    blocked: false,
    remainingAttempts: MAX_FAILURES - record.failures,
  };
}

/**
 * Reseta as tentativas após login bem-sucedido.
 */
export function resetAttempts(req: Request): void {
  const ip = getClientIp(req);
  attemptsByIp.delete(ip);
}

// Limpeza de memória a cada hora para IPs expirados
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of attemptsByIp.entries()) {
    if (now > record.blockedUntil && now - record.lastAttempt > WINDOW_DURATION_MS) {
      attemptsByIp.delete(ip);
    }
  }
}, 60 * 60 * 1000);
