import app from './app';
import { logger } from './lib/logger';
import { ensureTablesExist } from '@workspace/db';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function start() {
  await ensureTablesExist();
  app.listen(PORT, () => {
    logger.info(`NestPro API server listening on http://localhost:${PORT}/api`);
  });
}

start().catch((err) => {
  logger.error(err, 'Failed to start server');
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
