import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import winston from 'winston';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import routes
import authRoutes from './routes/auth';
import entityRoutes from './routes/entities';
import transactionRoutes from './routes/transactions';
import dashboardRoutes from './routes/dashboard';
import treasuryRoutes from './routes/treasury';
import feeLimitsRoutes from './routes/fee-limits';
import treasuryManagementRoutes from './routes/treasury-management';
import monitoringRoutes from './routes/monitoring';
import reportsRoutes from './routes/reports';

// Load environment variables
dotenv.config();

// Create Express app and HTTP server
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Create WebSocket server for real-time notifications
const wss = new WebSocketServer({ 
  server,
  path: '/notifications'
});

// Store WebSocket connections
const notificationClients = new Set();

wss.on('connection', (ws) => {
  console.log('New notification client connected');
  notificationClients.add(ws);
  
  ws.on('close', () => {
    console.log('Notification client disconnected');
    notificationClients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    notificationClients.delete(ws);
  });
});

// Function to broadcast notifications to all connected clients
export const broadcastNotification = (notification: any) => {
  const message = JSON.stringify(notification);
  notificationClients.forEach((client: any) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending notification:', error);
        notificationClients.delete(client);
      }
    }
  });
};

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'whizunik-factoring-backend' },
  transports: [
    new winston.transports.File({ filename: '../logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: '../logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Whizunik Factoring Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/fee-limits', feeLimitsRoutes);
app.use('/api/treasury-management', treasuryManagementRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/reports', reportsRoutes);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    timestamp: new Date().toISOString(),
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whizunik-factoring';
    await mongoose.connect(mongoURI);
    logger.info('Connected to MongoDB successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    // Commenting out MongoDB connection for demo mode
    // await connectDB();
    logger.info('🎯 Running in demo mode with in-memory data');
    
    server.listen(PORT, () => {
      logger.info(`🚀 Whizunik Factoring Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📡 WebSocket notifications: ws://localhost:${PORT}/notifications`);
      if (process.env.NODE_ENV === 'development') {
        logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await mongoose.disconnect();
  process.exit(0);
});

// Start the server
startServer();

export default app;