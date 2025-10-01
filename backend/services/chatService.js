// src/services/chatService.js
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
import { sendPushNotification } from './notificationService.js'; 
const prisma = new PrismaClient();

/**
 * Creates or finds an existing 1-on-1 conversation.
 * Allows any user to initiate a chat with another user (e.g., member-to-trainer)
 * before a subscription is active.
 * @param {string} initiatorId - The User ID of the person starting the chat.
 * @param {string} recipientId - The User ID of the person being chatted with.
 */
export const findOrCreateConversation = async (initiatorId, recipientId) => {
  // 1. Basic check to ensure both users exist in the system.
  const usersExist = await prisma.user.count({
    where: { id: { in: [initiatorId, recipientId] } },
  });

  if (usersExist < 2) {
    throw new AppError('One or more users not found.', 404);
  }

  // 2. Find if a conversation already exists between these two users to avoid duplicates.
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { id: initiatorId } } },
        { participants: { some: { id: recipientId } } },
      ],
    },
    include: {
        participants: { select: { id: true, email: true } }
    }
  });

  if (existingConversation) {
    return existingConversation;
  }

  // 3. If no conversation exists, create a new one.
  return await prisma.conversation.create({
    data: {
      participants: {
        connect: [{ id: initiatorId }, { id: recipientId }],
      },
    },
    include: {
        participants: { select: { id: true, email: true } }
    }
  });
};

/**
 * @description Get all conversations for the logged-in user, sorted by recent activity.
 */
export const getUserConversations = async (userId) => {
    return await prisma.conversation.findMany({
        where: { participants: { some: { id: userId } } },
        orderBy: { updatedAt: 'desc' }, // Sort by the most recently updated
        include: {
          participants: { select: { id: true, email: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 }, // Last message preview
        }
    });
};

/**
 * @description Get all messages for a specific conversation, ensuring user has access.
 */
export const getConversationMessages = async (userId, conversationId) => {
    const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, participants: { some: { id: userId } } }
    });
    if (!conversation) throw new AppError('Conversation not found or you do not have access.', 404);

    return await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, email: true } } }
    });
};

/**
 * ✅ CORRECTED: A single, merged function for creating a message.
 * It saves the message to the DB and then triggers a push notification.
 */
export const createMessage = async (senderId, conversationId, content) => {
    // Step 1: Save the message and update the conversation timestamp in a single transaction.
    const newMessage = await prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
            data: { senderId, conversationId, content },
            include: { sender: { select: { id: true, email: true } } }
        });

        await tx.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        return message;
    });

    // Step 2: After the transaction is successful, send the push notification.
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: { select: { id: true } } }
    });

    // Find the recipient (the other person in the chat)
    const recipient = conversation.participants.find(p => p.id !== senderId);

    if (recipient) {
        // Find the sender's details for the notification message
        const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { email: true } });
        
        await sendPushNotification(
            [recipient.id], // The function expects an array of user IDs
            {
                title: `New message from ${sender.email}`, // Use a real name/username in production
                body: content,
            },
            { 
                type: 'new_message', 
                conversationId: conversationId 
            }
        );
    }
    
    // Step 3: Return the newly created message object.
    return newMessage;
};
