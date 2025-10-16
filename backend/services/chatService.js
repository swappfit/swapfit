import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
import { sendPushNotification } from './notificationService.js'; 

const prisma = new PrismaClient();

export const findOrCreateConversation = async (initiatorId, recipientId) => {
  try {
    // Check if both users exist
    const usersExist = await prisma.user.count({
      where: { id: { in: [initiatorId, recipientId] } },
    });

    if (usersExist < 2) {
      throw new AppError('One or more users not found.', 404);
    }

    // Check if conversation already exists
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

    // Create new conversation
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
  } catch (error) {
    console.error('Error in findOrCreateConversation:', error);
    throw error;
  }
};

export const getUserConversations = async (userId) => {
    try {
        return await prisma.conversation.findMany({
            where: { participants: { some: { id: userId } } },
            orderBy: { updatedAt: 'desc' },
            include: {
              participants: { select: { id: true, email: true } },
              messages: { 
                orderBy: { createdAt: 'desc' }, 
                take: 1,
                include: { sender: { select: { id: true, email: true } } }
              },
            }
        });
    } catch (error) {
        console.error('Error in getUserConversations:', error);
        throw error;
    }
};

export const getConversationMessages = async (userId, conversationId) => {
    try {
        // First verify user has access to this conversation
        const conversation = await prisma.conversation.findFirst({
            where: { 
                id: conversationId, 
                participants: { some: { id: userId } } 
            }
        });
        
        if (!conversation) {
            throw new AppError('Conversation not found or you do not have access.', 404);
        }

        return await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            include: { 
                sender: { select: { id: true, email: true } } 
            }
        });
    } catch (error) {
        console.error('Error in getConversationMessages:', error);
        throw error;
    }
};

export const createMessage = async (senderId, conversationId, content) => {
    try {
        // First verify user has access to this conversation
        const conversation = await prisma.conversation.findFirst({
            where: { 
                id: conversationId, 
                participants: { some: { id: senderId } } 
            }
        });
        
        if (!conversation) {
            throw new AppError('Conversation not found or you do not have access.', 404);
        }

        const newMessage = await prisma.$transaction(async (tx) => {
            const message = await tx.message.create({
                data: { 
                    senderId, 
                    conversationId, 
                    content,
                    createdAt: new Date()
                },
                include: { 
                    sender: { select: { id: true, email: true } },
                    conversation: {
                      select: {
                        participants: {
                          where: { id: { not: senderId } },
                          select: { id: true, email: true }
                        }
                      }
                    }
                }
            });

            await tx.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
            });

            return message;
        });

        // Send push notification to other participants
        if (newMessage.conversation && newMessage.conversation.participants.length > 0) {
          const recipients = newMessage.conversation.participants;
          
          await sendPushNotification(
              recipients.map(r => r.id),
              {
                  title: `New message from ${newMessage.sender.email}`,
                  body: content,
              },
              { 
                  type: 'new_message', 
                  conversationId: conversationId 
              }
          );
        }
        
        return newMessage;
    } catch (error) {
        console.error('Error in createMessage:', error);
        throw error;
    }
};