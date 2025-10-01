// src/controllers/chatController.js
import * as chatService from '../services/chatService.js';
import { io } from '../server.js'; // Import io for broadcasting
import catchAsync from '../utils/catchAsync.js';

// --- API Controllers ---

export const startConversation = catchAsync(async (req, res) => {
    const { recipientId } = req.body;
    const conversation = await chatService.findOrCreateConversation(req.user.id, recipientId);
    res.status(200).json({ success: true, data: conversation });
});

export const getConversations = catchAsync(async (req, res) => {
    const conversations = await chatService.getUserConversations(req.user.id);
    res.status(200).json({ success: true, data: conversations });
});

export const getMessages = catchAsync(async (req, res) => {
    const { conversationId } = req.params;
    const messages = await chatService.getConversationMessages(req.user.id, conversationId);
    res.status(200).json({ success: true, data: messages });
});


// --- Socket.io Event Handler ---
// This function is NOT a controller for API routes. It's called by the socket server.
export const handleSendMessage = async (socket, data) => {
  try {
    const { conversationId, content } = data;
    // The user object is attached to the socket from our new auth middleware
    const senderId = socket.user.id; 

    if (!conversationId || !content) return; // Basic validation

    // Save the message to the DB
    const newMessage = await chatService.createMessage(senderId, conversationId, content);

    // Broadcast the message to the room
    io.to(conversationId).emit('newMessage', newMessage);

  } catch (error) {
    console.error("Socket send message error:", error);
    // Optionally emit an error back to the sender
    socket.emit('error', { message: 'Failed to send message.' });
  }
};

