// Routes/chatRoutes.js
import express from 'express';
import * as chatController from '../controllers/chatController.js';
import jwtAuth from '../middlewares/jwtAuth.js';
import validate, {
    startConversationSchema,
    conversationIdParamSchema,
} from '../validators/chatValidator.js';

const router = express.Router();
router.use(jwtAuth);

router.post(
    '/conversations',
    validate(startConversationSchema),
    chatController.startConversation
);
router.get('/conversations', chatController.getConversations);
router.get(
    '/conversations/:conversationId/messages',
    validate(conversationIdParamSchema),
    chatController.getMessages
);

export default router;

