/**
 * Kealee API Server
 * Express server for AI bots and growth metrics endpoints.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import botsRouter from './routes/bots';

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), service: '@kealee/api' });
});

// ── Bot Routes ────────────────────────────────────────────────────────────────
app.use('/api/bots', botsRouter);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api] Unhandled error:', err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`[api] Kealee API server running on http://localhost:${PORT}`);
  console.log(`[api] Bot endpoints: http://localhost:${PORT}/api/bots`);
  console.log(`[api] Health check:  http://localhost:${PORT}/health`);
});

export default app;
