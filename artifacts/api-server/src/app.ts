import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger';
import { errorHandler } from './middlewares/error-handler';
import router from './routes/index';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(pinoHttp({ logger }));

app.use('/api', router);
app.use(errorHandler);

export default app;
