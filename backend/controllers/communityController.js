import * as communityService from '../services/communityService.js';
import * as authService from '../services/authService.js'; // ⬅️ IMPORT AUTH SERVICE
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// ✅ --- THE FIX --- ✅
// We are copying the exact, working pattern from your dietController.
// This helper function finds the user ID regardless of the auth method.
const getUserId = async (req) => {
  // If Auth0 middleware was used and set req.auth (for mobile client)
  if (req.auth?.payload?.sub) {
    console.log('[CommunityController] Using Auth0 user ID from payload');
    const user = await authService.getUserByAuth0Id(req.auth.payload.sub);
    if (!user) {
      throw new AppError('User not found for the given Auth0 ID.', 404);
    }
    return user.id;
  }
  // If a different JWT middleware was used and set req.user (for another client)
  if (req.user?.id) {
    console.log('[CommunityController] Using JWT user ID');
    return req.user.id;
  }
  // If no user information is found
  throw new AppError('Authentication failed: No user identifier found in request.', 401);
};


export const createPost = catchAsync(async (req, res, next) => {
  console.log('➡️ [CONTROLLER] Reached createPost controller.');
  
  // Use the reliable helper function to get the user ID
  const userId = await getUserId(req);
  
  const { content, imageUrl } = req.body;
  
  console.log('✅ [CONTROLLER] Image URL from client:', imageUrl);
  console.log('✅ [CONTROLLER] Post content from client:', content);
  
  // Pass the correct userId to the service
  const newPost = await communityService.createPost(userId, content, imageUrl);
  
  res.status(201).json({ success: true, message: 'Post created successfully.', data: newPost });
});

export const getAllPosts = catchAsync(async (req, res) => {
  console.log('➡️ [CONTROLLER] Reached getAllPosts controller.');
  const result = await communityService.getAllPosts(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getPostById = catchAsync(async (req, res) => {
    console.log('➡️ [CONTROLLER] Reached getPostById controller.');
    const post = await communityService.getPostById(req.params.postId);
    res.status(200).json({ success: true, data: post });
});

export const updatePost = catchAsync(async (req, res) => {
  console.log('➡️ [CONTROLLER] Reached updatePost controller.');
  const userId = await getUserId(req); // ⬅️ USE HELPER
  const updatedPost = await communityService.updatePost(userId, req.params.postId, req.body.content);
  res.status(200).json({ success: true, message: 'Post updated successfully.', data: updatedPost });
});

export const deletePost = catchAsync(async (req, res) => {
  console.log('➡️ [CONTROLLER] Reached deletePost controller.');
  const userId = await getUserId(req); // ⬅️ USE HELPER
  await communityService.deletePost(userId, req.params.postId);
  res.status(204).send();
});

export const likePost = catchAsync(async (req, res) => {
  console.log('➡️ [CONTROLLER] Reached likePost controller.');
  const userId = await getUserId(req); // ⬅️ USE HELPER
  const result = await communityService.likePost(userId, req.params.postId);
  res.status(200).json({ success: true, message: result.message, data: result.data });
});

export const createComment = catchAsync(async (req, res) => {
  console.log('➡️ [CONTROLLER] Reached createComment controller.');
  const userId = await getUserId(req); // ⬅️ USE HELPER
  const newComment = await communityService.createComment(userId, req.params.postId, req.body.content);
  res.status(201).json({ success: true, message: 'Comment added successfully.', data: newComment });
});

export const deleteComment = catchAsync(async (req, res) => {
  console.log('➡️ [CONTROLLER] Reached deleteComment controller.');
  const userId = await getUserId(req); // ⬅️ USE HELPER
  await communityService.deleteComment(userId, req.params.commentId);
  res.status(204).send();
});
