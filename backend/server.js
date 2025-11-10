// src/app.js
import dotenv from 'dotenv';
// This MUST be the first line to ensure all other files can access the variables.
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

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
import publicRoutes from './Routes/publicRoutes.js'; // Add this line
import errorHandler from './middlewares/errorHandler.js';
import cartRoutes from './Routes/cartRoutes.js';
import trainingRoutes from './Routes/trainingRoutes.js';
import merchantRoutes from './Routes/merchantRoutes.js';
import { handleSendMessage } from './controllers/chatController.js';
import webhookRoutes from './Routes/webhookRoutes.js';

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Auth0 configuration
const auth0Domain = 'dev-1de0bowjvfbbcx7q.us.auth0.com';
const auth0Audience = 'https://api.fitnessclub.com';

// Create a JWKS client to fetch the public keys
const client = jwksClient({
  jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

// Function to verify the Auth0 token
const verifyAuth0Token = async (token) => {
  try {
    // Decode the token without verification to get the header
    const decodedToken = jwt.decode(token, { complete: true });
    
    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
      throw new Error('Invalid token structure');
    }

    // Get the signing key
    const key = await client.getSigningKey(decodedToken.header.kid);
    const signingKey = key.getPublicKey();

    // Verify the token
    const verifiedToken = jwt.verify(token, signingKey, {
      audience: auth0Audience,
      issuer: `https://${auth0Domain}/`,
      algorithms: ['RS256']
    });

    return verifiedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid token');
  }
};

// --- Socket.IO logic ---
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication Error: Token not provided.'));
  }
  
  try {
    // Verify the Auth0 token directly
    const decodedToken = await verifyAuth0Token(token);
    const auth0Id = decodedToken.sub;
    
    // Find the user in your database
    const user = await prisma.user.findUnique({
      where: { auth0_id: auth0Id },
      select: { id: true, email: true, role: true }
    });
    
    if (!user) {
      return next(new Error('Authentication Error: User not found'));
    }
    
    // Attach the user to the socket
    socket.user = user;
    console.log(`Socket authenticated for user: ${user.email}`);
    next();
  } catch (err) {
    console.error('Socket auth error:', err);
    return next(new Error('Authentication Error: Invalid token.'));
  }
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
app.use('/api/public', publicRoutes); // Add this line
app.use('/api/cart', cartRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/webhooks', webhookRoutes); // Add this line for webhooks

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
