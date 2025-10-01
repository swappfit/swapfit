import express from 'express';
import * as communityController from '../controllers/communityController.js';
import { auth0Middleware } from '../middlewares/auth0Middleware.js';
// ✅ FIXED: Import the new specific validators instead of the old generic one
import {
  validateBody,
  validateParams,
  validateQuery,
  postContentSchema,
  commentContentSchema,
  postIdParamSchema,
  commentIdParamSchema,
  paginationSchema
} from '../validators/communityValidator.js';

const router = express.Router();

// --- Post Routes ---

router.get(
    '/posts',
    validateQuery(paginationSchema), // Use validateQuery for req.query
    communityController.getAllPosts
);

router.get(
    '/posts/:postId',
    validateParams(postIdParamSchema), // Use validateParams for req.params
    communityController.getPostById
);

router.post(
  '/posts',
  auth0Middleware,         
  validateBody(postContentSchema), // Use validateBody for req.body
  communityController.createPost
);

router.post(
  '/posts/:postId/like',
  auth0Middleware,
  validateParams(postIdParamSchema), // Use validateParams
  communityController.likePost
);

router.put(
  '/posts/:postId',
  auth0Middleware,
  validateParams(postIdParamSchema), // Validate params separately
  validateBody(postContentSchema),   // Validate body separately
  communityController.updatePost
);

router.delete(
  '/posts/:postId',
  auth0Middleware,
  validateParams(postIdParamSchema), // Use validateParams
  communityController.deletePost
);

// --- Comment Routes ---

// ✅ FIXED: This route now correctly separates param and body validation, solving the error.
router.post(
  '/posts/:postId/comments',
  auth0Middleware,
  validateParams(postIdParamSchema),   // First, validate the postId from the URL
  validateBody(commentContentSchema),    // Second, validate the content from the body
  communityController.createComment
);

router.delete(
  '/comments/:commentId',
  auth0Middleware,
  validateParams(commentIdParamSchema), // Use validateParams
  communityController.deleteComment
);

export default router;