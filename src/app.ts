import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { errorHandler } from './middleware/error-handler.js';
import { logger } from './config/logger.js';

const app: Express = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true, // Required for httpOnly cookie exchange
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

// Logging Middleware
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
  });
});

// Root Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Vilogit Backend Origin is LIVE!' 
  });
});

// --- API ROUTES ---
import authRoutes from './modules/auth/routes/auth.routes.js';
import inferenceRoutes from './modules/inference/routes/inference.routes.js';
import usersRoutes from './modules/users/routes/users.routes.js';
import apiKeyRoutes from './modules/api-keys/routes/api-key.routes.js';
import projectRoutes from './modules/projects/routes/project.routes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/inference', inferenceRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/api-keys', apiKeyRoutes);
app.use('/api/v1/projects', projectRoutes);

// Error Handling
app.use(errorHandler);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot find ${req.originalUrl} on this server!`,
  });
});

export default app;
