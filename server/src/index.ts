import './types'; // Load type augmentations
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './utils/config';
import { rateLimit } from './middleware/rateLimit.middleware';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import calendarRoutes from './routes/calendar.routes';
import subscriptionRoutes from './routes/subscription.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import signoffRoutes from './routes/signoff.routes';
import contractorsRoutes from './routes/contractors';
import smartSearchRoutes from './routes/smartSearch.routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - only allow specified origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (config.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging (disable in production for performance)
if (config.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing with size limits to prevent memory exhaustion
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Global rate limiting
app.use(rateLimit());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', calendarRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/signoff', signoffRoutes);
app.use('/api/contractors', contractorsRoutes);
app.use('/api/smart-search', smartSearchRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'ConnectTeam API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS: Origin not allowed' });
  }
  
  res.status(500).json({ 
    message: config.NODE_ENV === 'production' 
      ? 'An internal error occurred' 
      : err.message 
  });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 ConnectTeam API running on port ${config.PORT}`);
  console.log(`📍 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 Allowed origins: ${config.ALLOWED_ORIGINS.join(', ')}`);
});
