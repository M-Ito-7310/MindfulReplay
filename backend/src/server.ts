import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { initRepositories } from './database/repositories';
import { seedMockData } from './database/seedData';
import authRoutes from './routes/auth.routes';
import videoRoutes from './routes/video.routes';
import memoRoutes from './routes/memo.routes';
import taskRoutes from './routes/task.routes';
import reminderRoutes from './routes/reminder.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:8000',
    'http://localhost:3000',
    'http://192.168.1.10:8000',
    'exp://192.168.1.10:8000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/memos', memoRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reminders', reminderRoutes);

app.use(errorHandler);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, '0.0.0.0', async () => {
  // Initialize repositories and seed data
  initRepositories('mock'); // Use mock database for now
  
  // Seed with test data if in development
  if (process.env.NODE_ENV === 'development') {
    await seedMockData();
    logger.info('📦 Mock database seeded with test data');
  }
  
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;