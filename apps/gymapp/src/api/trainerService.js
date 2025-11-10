// src/api/trainerService.js
import apiClient from './apiClient';

/**
 * @description Fetches the list of a trainer's active subscribers.
 * @returns {Promise<object>} The backend response with the list of subscribers.
 */
export const getMyClients = async () => {
    try {
        const response = await apiClient.get('/trainers/subscribers');
        console.log('✅ Clients API call successful:', response);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching clients:', error);
        throw error;
    }
};

/**
 * @description Fetches the trainer's own detailed profile data.
 * @returns {Promise<object>} The backend response with the profile data.
 */
export const getMyProfile = async () => {
    try {
        // FIX: Use the correct endpoint that matches the route definition
        const response = await apiClient.get('/trainers/profile/me');
        console.log('✅ Profile API call successful:', response);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        throw error;
    }
};

/**
 * @description Gets all conversations for the trainer.
 * @returns {Promise<object>} The backend response with the list of conversations.
 */
export const getConversations = async (retryCount = 0) => {
    const maxRetries = 2; // Reduced from 3 to 2
    const retryDelay = 1000; // 1 second
    
    try {
        console.log(`🔄 Making API call to /chat/conversations... (Attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        const response = await apiClient.get('/chat/conversations');
        
        console.log('✅ Conversations API call successful!');
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Full response data:', response.data);
        console.log('Response data type:', typeof response.data);
        console.log('Is response.data an array?', Array.isArray(response.data));
        
        // Check if response.data has properties
        if (response.data && typeof response.data === 'object') {
            console.log('Response.data properties:', Object.keys(response.data));
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching conversations:', error);
        
        if (error.response) {
            console.error('Error response status:', error.response.status);
            console.error('Error response data:', error.response.data);
            console.error('Error response headers:', error.response.headers);
            
            // Try to extract error message
            let errorMessage = 'Failed to load conversations';
            
            if (error.response.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response.data.msg) {
                    errorMessage = error.response.data.msg;
                }
            }
            
            // Add status code specific information
            if (error.response.status === 500) {
                errorMessage = `Server Error: ${errorMessage}`;
                console.error('💥 Server error details:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else if (error.response.status === 401) {
                errorMessage = 'Authentication failed. Please log in again.';
            } else if (error.response.status === 403) {
                errorMessage = 'You do not have permission to access conversations.';
            } else if (error.response.status === 404) {
                errorMessage = 'Conversations endpoint not found.';
            }
            
            // Create enhanced error with more information
            const enhancedError = new Error(errorMessage);
            enhancedError.status = error.response.status;
            enhancedError.originalError = error;
            enhancedError.serverResponse = error.response.data;
            
            // Retry logic for server errors (but not for 500 errors that return a proper error response)
            if (error.response.status >= 500 && !error.response.data.message && retryCount < maxRetries) {
                console.log(`🔄 Retrying in ${retryDelay}ms... (${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return getConversations(retryCount + 1);
            }
            
            throw enhancedError;
        } else if (error.request) {
            console.error('No response received:', error.request);
            const networkError = new Error('Network error: No response from server');
            networkError.originalError = error;
            throw networkError;
        } else {
            console.error('Error message:', error.message);
            throw error;
        }
    }
};

/**
 * @description Gets messages for a specific conversation.
 * @param {string} conversationId - The ID of the conversation.
 * @returns {Promise<object>} The backend response with the messages.
 */
export const getMessages = async (conversationId, retryCount = 0) => {
    const maxRetries = 1; // Reduced from 2 to 1
    const retryDelay = 1000;
    
    try {
        console.log(`🔄 Making API call to /chat/conversations/${conversationId}/messages...`);
        const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
        
        console.log('✅ Messages API call successful!');
        console.log('Response data:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching messages:', error);
        
        if (error.response) {
            console.error('Error response status:', error.response.status);
            console.error('Error response data:', error.response.data);
            
            // Retry logic for server errors (but not for 500 errors that return a proper error response)
            if (error.response.status >= 500 && !error.response.data.message && retryCount < maxRetries) {
                console.log(`🔄 Retrying messages in ${retryDelay}ms... (${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return getMessages(conversationId, retryCount + 1);
            }
        }
        
        throw error;
    }
};

/**
 * @description Sends a reply message in a conversation.
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} content - The message content.
 * @returns {Promise<object>} The backend response with the new message.
 */
export const sendMessage = async (conversationId, content) => {
    try {
        const response = await apiClient.post(`/chat/conversations/${conversationId}/messages`, { content });
        console.log('✅ Send message API call successful:', response);
        return response.data;
    } catch (error) {
        console.error('❌ Error sending message:', error);
        
        if (error.response) {
            console.error('Error response status:', error.response.status);
            console.error('Error response data:', error.response.data);
        }
        
        throw error;
    }
};

/**
 * @description Starts a new conversation with a client.
 * @param {string} clientId - The ID of the client to start a conversation with.
 * @returns {Promise<object>} The backend response with the new conversation details.
 */
export const startConversation = async (clientId) => {
    try {
        if (!clientId) {
            throw new Error('Client ID is required');
        }
        
        console.log('🔄 Starting conversation with client ID:', clientId);
        
        // Try the most common payload structures
        const payloads = [
            { recipientId: clientId },
            { participantId: clientId },
            { userId: clientId }
        ];
        
        for (const payload of payloads) {
            try {
                console.log('Trying payload:', payload);
                const response = await apiClient.post('/chat/conversations', payload);
                console.log('✅ Start conversation successful:', response);
                return response.data;
            } catch (error) {
                console.log('❌ Failed with payload:', payload, error.response?.data || error.message);
            }
        }
        
        throw new Error('All payload formats failed');
    } catch (error) {
        console.error('❌ Error starting conversation:', error);
        throw error;
    }
};