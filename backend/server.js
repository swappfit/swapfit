import dotenv from 'dotenv';
// This MUST be the first line to ensure all other files can access the variables.
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// --- Import All Route Files ---
import authRoutes from './Routes/authRoutes.js';
import dashboardRoutes from './Routes/dashboardRoutes.js';
import gymRoutes from './Routes/gymRoutes.js';
import trainerRoutes from './Routes/trainerRoutes.js';
import subscriptionRoutes from './Routes/subscriptionRoutes.js';
import workoutRoutes from './Routes/workoutRoutes.js';
import dietRoutes from './Routes/dietRoutes.js';
import healthRoutes from './Routes/healthRoutes.js';
import chatRoutes from './Routes/chatRoutes.js';
import notificationRoutes from './Routes/notificationRoutes.js';
import transactionRoutes from './Routes/transactionRoutes.js';
import analyticsRoutes from './Routes/analyticsRoutes.js';
import userRoutes from './Routes/userRoutes.js';
import challengeRoutes from './Routes/challengeRoutes.js';
import communityRoutes from './Routes/communityRoutes.js';
import productRoutes from './Routes/productRoutes.js';
import bookingRoutes from './Routes/bookingRoutes.js';
import multiGymRoutes from './Routes/multiGymRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';
import errorHandler from './middlewares/errorHandler.js';
import cartRoutes from './Routes/cartRoutes.js';
import trainingRoutes from './Routes/trainingRoutes.js';
import merchantRoutes from './Routes/merchantRoutes.js';
import { handleSendMessage } from './controllers/chatController.js';


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --- Socket.IO logic ---
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication Error: Token not provided.'));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
    if (err) {
      return next(new Error('Authentication Error: Invalid token.'));
    }
    socket.user = userPayload;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.email} (Socket ID: ${socket.id})`);
  socket.on('joinRoom', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.user.email} joined room ${conversationId}`);
  });
  socket.on('sendMessage', (data) => {
    handleSendMessage(socket, data);
  });
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.email}`);
  });
});

// --- Standard Express Middleware ---
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
})); // Middleware to parse JSON bodies

app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log('---------------------------------');
  console.log('Request Received by Express App:');
  console.log(`METHOD: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(`BODY:`, req.body);
  console.log('---------------------------------');
  next();
});


// --- Register All API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/multi-gym', multiGymRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/merchant', merchantRoutes);


// --- Global Error Handler ---
app.use(errorHandler);

// --- Root Endpoint and Server Initialization ---
app.get('/', (req, res) => {
  res.send('API is running and WebSocket server is active...');
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };

