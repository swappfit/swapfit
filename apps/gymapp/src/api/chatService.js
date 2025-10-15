// src/api/chatService.js
import apiClient from './apiClient';

export const startConversation = async (recipientId) => {
  try {
    const response = await apiClient.post('/chat/conversations', { recipientId });
    return response.data;
  } catch (error) {
    console.error('Error starting conversation:', error);
    throw error;
  }
};

export const getConversations = async () => {
  try {
    const response = await apiClient.get('/chat/conversations');
    return response.data;
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
};

export const getMessages = async (conversationId) => {
  try {
    const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

export const sendMessage = async (conversationId, content) => {
  try {
    const response = await apiClient.post(`/chat/conversations/${conversationId}/messages`, { content });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};