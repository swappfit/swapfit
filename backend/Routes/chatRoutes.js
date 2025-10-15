import express from 'express';
import * as chatController from '../controllers/chatController.js';
import authGatekeeper from '../middlewares/authGatekeeper.js';
import validate, {
    startConversationSchema,
    conversationIdParamSchema,
    sendMessageSchema,
} from '../validators/chatValidator.js';

const router = express.Router();

// Add a route logger to debug
router.use((req, res, next) => {
  console.log(`Chat route: ${req.method} ${req.url}`);
  next();
});

// Apply authGatekeeper authentication to all routes
router.use(authGatekeeper);

// Start a new conversation
router.post(
    '/conversations',
    validate(startConversationSchema),
    chatController.startConversation
);

// Get all conversations for the current user
router.get('/conversations', chatController.getConversations);

// Get messages for a specific conversation
router.get(
    '/conversations/:conversationId/messages',
    validate(conversationIdParamSchema),
    chatController.getMessages
);

// Send a message to a conversation
router.post(
    '/conversations/:conversationId/messages',
    validate(sendMessageSchema),
    chatController.sendMessage
);

export default router;