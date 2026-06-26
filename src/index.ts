import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import connectDB from './configs/db';
import './configs/firebase';

import errorHandler from './middlewares/errorHandler';

import authRoutes from './routes/authRoutes';
import promptRoutes from './routes/promptRoutes';
import reviewRoutes from './routes/reviewRoutes';
import bookmarkRoutes from './routes/bookmarkRoutes';
import reportRoutes from './routes/reportRoutes';
import paymentRoutes from './routes/paymentRoutes';
import userRoutes from './routes/userRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import webhookRoutes from './routes/webhookRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// Database Connection
connectDB();

// Socket.io
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join:prompt', (promptId: string) => {
    socket.join(`prompt:${promptId}`);
  });

  socket.on('leave:prompt', (promptId: string) => {
    socket.leave(`prompt:${promptId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

export const getIO = () => io;

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Stripe webhook route MUST be registered before express.json() to get raw body
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'PromptVerse API is running',
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/prompts', promptRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/bookmarks', bookmarkRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/ai', aiRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 PromptVerse Server running on port ${PORT}`);
});

export default app;