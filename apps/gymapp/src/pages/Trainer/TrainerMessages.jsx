import React, { useState, useEffect, useRef } from "react";
import * as trainerService from "../../api/trainerService";
import { useAuth } from "../../context/AuthContext";
import { MessageSquare, Send, X, Check, AlertTriangle, User, RefreshCw, Bug, Eye, Wifi, WifiOff } from 'lucide-react';

export default function TrainerMessages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [clients, setClients] = useState([]);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const [refreshingMessages, setRefreshingMessages] = useState(false);
  const [conversationError, setConversationError] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetriesReached, setMaxRetriesReached] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchClients();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      startPolling();
    } else {
      stopPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startPolling = () => {
    stopPolling();
    pollingIntervalRef.current = setInterval(() => {
      if (selectedConversation) {
        fetchMessages(selectedConversation.id, true);
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setApiResponse(null);
      setIsRetrying(false);
      setMaxRetriesReached(false);
      
      const response = await trainerService.getConversations();
      setApiResponse(response);
      
      // Try to extract conversations from different response structures
      let conversationsData = [];
      
      if (response === null || response === undefined) {
        console.log('Response is null or undefined');
        conversationsData = [];
      } else if (Array.isArray(response)) {
        console.log('Response is an array');
        conversationsData = response;
      } else if (typeof response === 'object') {
        console.log('Response is an object');
        
        // Try common property names
        if (Array.isArray(response.data)) {
          conversationsData = response.data;
        } else if (Array.isArray(response.conversations)) {
          conversationsData = response.conversations;
        } else if (Array.isArray(response.results)) {
          conversationsData = response.results;
        } else if (response.success && Array.isArray(response.data)) {
          conversationsData = response.data;
        } else if (response.success && Array.isArray(response.conversations)) {
          conversationsData = response.conversations;
        } else {
          // Check if the object itself might be a single conversation
          if (response.id || response._id || response.participants) {
            conversationsData = [response];
          } else {
            console.log('Unknown response format, treating as empty array');
            conversationsData = [];
          }
        }
      } else {
        console.log('Response is of unexpected type:', typeof response);
        conversationsData = [];
      }
      
      console.log('Final conversations data:', conversationsData);
      setConversations(conversationsData);
      
    } catch (err) {
      console.error("❌ Fetch Conversations Error:", err);
      
      let errorMessage = 'Failed to load conversations.';
      let errorDetails = null;
      
      if (err.status) {
        if (err.status === 500) {
          errorMessage = 'Server error occurred while loading conversations.';
          errorDetails = err.serverResponse || 'Internal server error';
          
          // Check if we've reached max retries
          if (retryCount >= 2) {
            setMaxRetriesReached(true);
            errorMessage += ' Maximum retry attempts reached.';
          }
        } else if (err.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.status === 403) {
          errorMessage = 'You do not have permission to access conversations.';
        } else if (err.status === 404) {
          errorMessage = 'Conversations endpoint not found.';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError({
        message: errorMessage,
        details: errorDetails,
        status: err.status,
        originalError: err.originalError || err
      });
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await trainerService.getMyClients();
      
      let clientsData = [];
      
      if (Array.isArray(response)) {
        clientsData = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          clientsData = response.data;
        } else if (Array.isArray(response.subscribers)) {
          clientsData = response.subscribers;
        } else if (response.success && Array.isArray(response.data)) {
          clientsData = response.data;
        }
      }
      
      if (Array.isArray(clientsData)) {
        setClients(clientsData.map(sub => ({
          id: sub.user?.id || sub.id || sub._id,
          name: sub.user?.memberProfile?.name || sub.name || sub.user?.email?.split('@')[0] || 'Unknown',
          email: sub.user?.email || sub.email,
        })));
      }
    } catch (err) {
      console.error("❌ Fetch Clients Error:", err);
    }
  };

  const fetchMessages = async (conversationId, isPolling = false) => {
    try {
      if (!isPolling) {
        setRefreshingMessages(true);
      }
      
      const response = await trainerService.getMessages(conversationId);
      
      let messagesData = [];
      
      if (Array.isArray(response)) {
        messagesData = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          messagesData = response.data;
        } else if (Array.isArray(response.messages)) {
          messagesData = response.messages;
        } else if (response.success && Array.isArray(response.data)) {
          messagesData = response.data;
        }
      }
      
      const formattedMessages = messagesData.map(msg => ({
        id: msg.id || msg._id || `msg-${Date.now()}-${Math.random()}`,
        content: msg.content || msg.text || msg.message || 'No content',
        senderId: msg.senderId || msg.sender || msg.from || msg.userId,
        createdAt: msg.createdAt || msg.timestamp || new Date().toISOString()
      }));
      
      if (!isPolling || formattedMessages.length !== messages.length) {
        setMessages(formattedMessages);
      }
      
    } catch (err) {
      console.error("❌ Fetch Messages Error:", err);
      if (!isPolling) {
        setError({
          message: err.message || 'Failed to load messages.',
          status: err.status,
          originalError: err.originalError || err
        });
      }
    } finally {
      if (!isPolling) {
        setRefreshingMessages(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    const messageContent = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);
    
    // Optimistically add the message to the UI
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: user.id,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    
    try {
      const response = await trainerService.sendMessage(selectedConversation.id, messageContent);
      
      let newMessageData = null;
      
      if (response && typeof response === 'object') {
        if (response.data) {
          newMessageData = response.data;
        } else if (response.message) {
          newMessageData = response.message;
        } else if (response.id || response.content) {
          newMessageData = response;
        }
      }
      
      if (newMessageData) {
        // Replace the optimistic message with the real one
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === optimisticMessage.id 
              ? {
                  id: newMessageData.id || newMessageData._id,
                  content: newMessageData.content || newMessageData.text || newMessageData.message,
                  senderId: user.id,
                  createdAt: newMessageData.createdAt || new Date().toISOString()
                }
              : msg
          )
        );
      } else {
        // Remove the optimistic message if the send failed
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== optimisticMessage.id));
        setError({
          message: 'Failed to send message: Invalid response from server',
          status: 500
        });
      }
    } catch (err) {
      // Remove the optimistic message if the send failed
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== optimisticMessage.id));
      setError({
        message: err.message || 'Failed to send message. Please try again.',
        status: err.status,
        originalError: err.originalError || err
      });
      console.error("❌ Send Message Error:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartNewConversation = async () => {
    if (!selectedClient) return;
    
    setStartingConversation(true);
    setConversationError(null);
    
    try {
      console.log('Selected client:', selectedClient);
      console.log('Client ID:', selectedClient.id);
      
      const response = await trainerService.startConversation(selectedClient.id);
      
      let newConversationData = null;
      
      if (response && typeof response === 'object') {
        if (response.data) {
          newConversationData = response.data;
        } else if (response.conversation) {
          newConversationData = response.conversation;
        } else if (response.id || response.participants) {
          newConversationData = response;
        }
      }
      
      if (newConversationData) {
        // Add the new conversation to the list
        setConversations(prevConversations => [newConversationData, ...prevConversations]);
        // Select the new conversation
        setSelectedConversation(newConversationData);
        // Close the modal
        setShowNewMessageModal(false);
        setSelectedClient(null);
        setMessageSuccess(true);
        setTimeout(() => setMessageSuccess(false), 3000);
      } else {
        setConversationError('Failed to start conversation: Invalid response from server');
      }
    } catch (err) {
      console.error("❌ Start Conversation Error:", err);
      
      let errorMessage = 'Failed to start conversation. Please try again.';
      
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setConversationError(errorMessage);
    } finally {
      setStartingConversation(false);
    }
  };

  const getOtherParticipant = (conversation) => {
    // Find the participant that is not the current user
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      return null;
    }
    return conversation.participants.find(p => p.id !== user.id);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleRetry = () => {
    if (maxRetriesReached) {
      // Reset retry count and try again
      setRetryCount(0);
      setMaxRetriesReached(false);
    }
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    fetchConversations();
  };

  // Helper function to safely render error messages
  const getErrorMessage = (errorObj) => {
    if (!errorObj) return '';
    if (typeof errorObj === 'string') return errorObj;
    if (errorObj.message && typeof errorObj.message === 'string') return errorObj.message;
    return 'An unknown error occurred';
  };

  // Helper function to safely render error details
  const getErrorDetails = (errorObj) => {
    if (!errorObj) return '';
    if (errorObj.details && typeof errorObj.details === 'string') return errorObj.details;
    if (errorObj.details && typeof errorObj.details === 'object') {
      return JSON.stringify(errorObj.details);
    }
    return '';
  };

  // Handle authentication state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          You need to be logged in to view your messages. Please log in to continue.
        </p>
        <button 
          onClick={() => window.location.href = '/login'} 
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Messages</h2>
            {isRetrying && (
              <div className="flex items-center gap-1 text-yellow-400">
                <WifiOff size={16} className="animate-pulse" />
                <span className="text-xs">Retrying...</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Toggle Debug Info"
            >
              <Bug size={20} className="text-white" />
            </button>
            <button
              onClick={() => setShowNewMessageModal(true)}
              className="p-2 rounded-full bg-teal-600 hover:bg-teal-700 transition-colors"
              title="New Message"
            >
              <MessageSquare size={20} className="text-white" />
            </button>
          </div>
        </div>
        
        {messageSuccess && (
          <div className="mx-4 mt-2 p-2 bg-green-600 rounded-lg flex items-center">
            <Check size={16} className="text-white mr-2" />
            <span className="text-white text-sm">Conversation started successfully</span>
          </div>
        )}
        
        {showDebugInfo && (
          <div className="mx-4 mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-300">Debug Info</h4>
              <button
                onClick={() => setShowDebugInfo(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p>User ID: {user?.id || 'Not available'}</p>
              <p>Conversations: {conversations.length}</p>
              <p>Clients: {clients.length}</p>
              <p>Retry Count: {retryCount}</p>
              <p>Max Retries Reached: {maxRetriesReached ? 'Yes' : 'No'}</p>
              <p>API Response: {apiResponse ? 'Received' : 'None'}</p>
              {error && (
                <p className="text-red-400">Error Status: {error.status || 'Unknown'}</p>
              )}
              {apiResponse && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-400">View API Response</summary>
                  <pre className="mt-1 p-2 bg-gray-900 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-400 mb-2 text-center font-medium">
              {getErrorMessage(error)}
            </p>
            {getErrorDetails(error) && (
              <p className="text-red-300 mb-4 text-center text-sm">
                {getErrorDetails(error)}
              </p>
            )}
            {error.status === 500 && (
              <p className="text-gray-400 mb-4 text-center text-sm">
                This is a server error. The issue has been logged and will be fixed soon.
              </p>
            )}
            {maxRetriesReached && (
              <p className="text-yellow-400 mb-4 text-center text-sm">
                Maximum retry attempts reached. Please try again later or refresh the page.
              </p>
            )}
            <div className="flex gap-2">
              <button 
                onClick={handleRetry}
                disabled={isRetrying || maxRetriesReached}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRetrying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Try Again
                  </>
                )}
              </button>
              {error.status === 500 && (
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                  Refresh Page
                </button>
              )}
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <MessageSquare className="h-12 w-12 text-gray-500 mb-4" />
            <p className="text-gray-400 text-center">No conversations found.</p>
            <p className="text-gray-500 text-sm mt-2">Try starting a new conversation with a client.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              return (
                <div
                  key={conversation.id || conversation._id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 ${
                    selectedConversation?.id === conversation.id ? "bg-gray-800" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold mr-3">
                      {otherParticipant?.email?.charAt(0).toUpperCase() || otherParticipant?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {otherParticipant?.name || otherParticipant?.email || "Unknown User"}
                      </h3>
                      {conversation.messages && conversation.messages.length > 0 && (
                        <p className="text-sm text-gray-400 truncate">
                          {conversation.messages[0].content || conversation.messages[0].text || conversation.messages[0].message}
                        </p>
                      )}
                    </div>
                    {conversation.updatedAt && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-gray-700 flex items-center">
              <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold mr-3">
                {getOtherParticipant(selectedConversation)?.email?.charAt(0).toUpperCase() || 
                 getOtherParticipant(selectedConversation)?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {getOtherParticipant(selectedConversation)?.name || 
                   getOtherParticipant(selectedConversation)?.email || "Unknown User"}
                </h2>
                <p className="text-sm text-gray-400">Active now</p>
              </div>
              <button
                onClick={() => fetchMessages(selectedConversation.id)}
                className="ml-auto p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                title="Refresh messages"
              >
                {refreshingMessages ? (
                  <RefreshCw size={20} className="text-white animate-spin" />
                ) : (
                  <RefreshCw size={20} className="text-white" />
                )}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <MessageSquare className="h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.senderId === user.id
                          ? "bg-teal-600 text-white"
                          : "bg-gray-700 text-white"
                      } ${message.isOptimistic ? "opacity-70" : ""}`}
                    >
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === user.id ? "text-teal-200" : "text-gray-400"
                      }`}>
                        {formatTime(message.createdAt)}
                        {message.isOptimistic && " (Sending...)"}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="ml-2 p-2 bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <Send size={20} className="text-white" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <MessageSquare className="h-12 w-12 text-gray-500 mb-4" />
            <p className="text-gray-400">Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Start New Conversation</h3>
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  setConversationError(null);
                }}
                className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            {conversationError && (
              <div className="mb-4 p-3 bg-red-600 bg-opacity-20 border border-red-600 rounded-lg flex items-start">
                <AlertTriangle size={16} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-400 text-sm">{conversationError}</p>
                  <p className="text-red-300 text-xs mt-1">Client ID: {selectedClient?.id}</p>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Client
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client);
                        setConversationError(null);
                      }}
                      className={`p-3 rounded-lg cursor-pointer flex items-center ${
                        selectedClient?.id === client.id
                          ? "bg-teal-600 bg-opacity-20 border border-teal-600"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold mr-3">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-400">{client.email}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {client.id}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No clients available</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  setConversationError(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartNewConversation}
                disabled={!selectedClient || startingConversation}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {startingConversation ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  "Start Conversation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}