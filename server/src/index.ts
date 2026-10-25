import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import truckRoutes from './routes/truck';
import freightRoutes from './routes/freights';
import fuelingRoutes from './routes/fuelings';
import expenseRoutes from './routes/expenses';
import debtRoutes from './routes/debts';
import fixedExpenseRoutes from './routes/fixedExpenses';
import maintenanceRoutes from './routes/maintenances';
import checklistRoutes from './routes/checklists';
import dashboardRoutes from './routes/dashboard';
import authRoutes from './routes/auth';
import invoiceRoutes from './routes/invoices';
import { pinAuthMiddleware } from './middleware/auth';

const app = express();
const PORT = Number(process.env.API_PORT) || Number(process.env.PORT) || 8080;

app.use(cors());
app.use(express.json());

// Servir frontend compilado (React SPA) em produção
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Rota de saúde pública
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Rotas de autenticação (públicas)
app.use('/api/auth', authRoutes);

// Middleware de proteção por PIN (aplica-se a /api)
app.use('/api', pinAuthMiddleware);

// Rotas de negócio protegidas
app.use('/api/truck', truckRoutes);
app.use('/api/freights', freightRoutes);
app.use('/api/fuelings', fuelingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/fixed-expenses', fixedExpenseRoutes);
app.use('/api/maintenances', maintenanceRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);

// Fallback SPA compatível com Express 5 para qualquer rota que não seja da API
if (fs.existsSync(distPath)) {
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Backend] TransFrete Pro API rodando na porta ${PORT}`);
});

// Keep process active across Node.js event loop versions
const keepAlive = setInterval(() => {}, 1000 * 60 * 60);

export default app;
