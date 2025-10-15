import * as chatService from '../services/chatService.js';
import { io } from '../server.js';
import catchAsync from '../utils/catchAsync.js';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to get user ID from Auth0
const getUserId = async (req) => {
  console.log('[ChatController] getUserId called, req.auth:', req.auth);
  
  // If Auth0 middleware was used and set req.auth
  if (req.auth?.payload?.sub) {
    console.log('[ChatController] Using Auth0 user ID from payload:', req.auth.payload.sub);
    // Get our internal database user ID from the Auth0 'sub' identifier
    const user = await prisma.user.findUnique({
      where: { auth0_id: req.auth.payload.sub },
      select: { id: true, email: true }
    });
    
    if (!user) throw new Error('User not found for the given Auth0 ID.');
    console.log('[ChatController] Found user:', user);
    return user.id;
  }
  
  // Try to get user ID from the gatekeeper middleware
  if (req.user?.id) {
    console.log('[ChatController] Using user ID from gatekeeper:', req.user.id);
    return req.user.id;
  }
  
  // Try to get user ID from the JWT token directly
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.id) {
          console.log('[ChatController] Using user ID from JWT token:', decoded.id);
          return decoded.id;
        }
      } catch (error) {
        console.error('[ChatController] Error decoding JWT:', error);
      }
    }
  }
  
  // If no user information is found
  console.error('[ChatController] No user identifier found in request');
  throw new Error('Authentication failed: No user identifier found in request.');
};

// --- API Controllers ---

export const startConversation = catchAsync(async (req, res) => {
    console.log('startConversation called with:', req.body);
    
    try {
        const userId = await getUserId(req);
        console.log('User ID:', userId);
        
        const { recipientId } = req.body;
        
        // Add validation to ensure recipientId is provided
        if (!recipientId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Recipient ID is required' 
            });
        }
        
        // Ensure the recipient is not the same as the sender
        if (recipientId === userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot start a conversation with yourself' 
            });
        }
        
        const conversation = await chatService.findOrCreateConversation(userId, recipientId);
        console.log('Conversation created:', conversation);
        res.status(200).json({ success: true, data: conversation });
    } catch (error) {
        console.error('Error in startConversation:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to start conversation' 
        });
    }
});

export const getConversations = catchAsync(async (req, res) => {
    try {
        const userId = await getUserId(req);
        console.log('[ChatController] getConversations for user:', userId);
        const conversations = await chatService.getUserConversations(userId);
        console.log('[ChatController] Found conversations:', conversations.length);
        res.status(200).json({ success: true, data: conversations });
    } catch (error) {
        console.error('Error in getConversations:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get conversations' 
        });
    }
});

export const getMessages = catchAsync(async (req, res) => {
    try {
        const userId = await getUserId(req);
        const { conversationId } = req.params;
        const messages = await chatService.getConversationMessages(userId, conversationId);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error('Error in getMessages:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get messages' 
        });
    }
});

export const sendMessage = catchAsync(async (req, res) => {
    try {
        const userId = await getUserId(req);
        const { conversationId } = req.params;
        const { content } = req.body;
        
        console.log('[ChatController] sendMessage:', { userId, conversationId, content });
        
        // Validate input
        if (!content || content.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Message content is required' 
            });
        }
        
        const message = await chatService.createMessage(userId, conversationId, content.trim());
        console.log('[ChatController] Message created:', message);
        
        // Broadcast the message via Socket.io
        io.to(conversationId).emit('newMessage', message);
        console.log(`[ChatController] Message broadcasted to room: ${conversationId}`);
        
        res.status(200).json({ success: true, data: message });
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send message' 
        });
    }
});

// --- Socket.io Event Handler ---
export const handleSendMessage = async (socket, data) => {
  try {
    const { conversationId, content } = data;
    
    // Get user ID from socket (already authenticated in server.js)
    const userId = socket.user.id;
    
    if (!conversationId || !content) {
      console.error('Missing conversationId or content in sendMessage');
      return;
    }

    console.log(`Creating message: userId=${userId}, conversationId=${conversationId}, content=${content}`);

    const newMessage = await chatService.createMessage(userId, conversationId, content);
    
    console.log('Message created successfully:', newMessage);
    
    // Broadcast the complete message object to the room
    io.to(conversationId).emit('newMessage', newMessage);
    console.log(`Message broadcasted to room: ${conversationId}`);

  } catch (error) {
    console.error("Socket send message error:", error);
    socket.emit('error', { message: 'Failed to send message.' });
  }
};