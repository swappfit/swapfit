import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

// --- Post Services ---

export const createPost = async (authorId, content, imageUrl) => {
  // This function is now fully correct and serves as the template for the others.
  try {
    const newPost = await prisma.post.create({
      data: {
        content,
        imageUrl,
        author: {
          connect: {
            id: authorId
          }
        }
      },
      include: {
        author: {
          select: { id: true, email: true } // Correctly selects only existing fields
        },
        comments: true,
        likes: true,
        _count: {
          select: { comments: true, likes: true }
        },
      }
    });
    return newPost;
  } catch (error) {
    console.error('❌ [FATAL SERVICE ERROR] Error during prisma.post.create:', error);
    throw error;
  }
};

export const getAllPosts = async ({ page = 1, limit = 10 }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        // ✅ FIXED: Select only 'id' and 'email' for the post's author.
        author: { select: { id: true, email: true } },
        comments: {
            include: {
                // ✅ FIXED: Select only 'id' and 'email' for the comment's author.
                author: { select: { id: true, email: true } }
            },
            orderBy: { createdAt: 'asc' }
        },
        likes: true,
        _count: { select: { comments: true, likes: true } },
      },
    }),
    prisma.post.count(),
  ]);
  return { data: posts, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } };
};

export const getPostById = async (postId) => {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            // ✅ FIXED: Select only 'id' and 'email' for the post's author.
            author: { select: { id: true, email: true } },
            comments: {
                include: {
                    // ✅ FIXED: Select only 'id' and 'email' for the comment's author.
                    author: { select: { id: true, email: true } }
                },
                orderBy: { createdAt: 'asc' }
            },
            likes: true
        }
    });
    if (!post) throw new AppError('Post not found.', 404);
    return post;
};

export const updatePost = async (authorId, postId, content) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError('Post not found.', 404);
  if (post.authorId !== authorId) throw new AppError('Forbidden: You can only edit your own posts.', 403);

  return await prisma.post.update({
    where: { id: postId },
    data: { content },
  });
};

export const deletePost = async (authorId, postId) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError('Post not found.', 404);
  if (post.authorId !== authorId) throw new AppError('Forbidden: You can only delete your own posts.', 403);
  
  await prisma.post.delete({ where: { id: postId } });
};

export const createComment = async (authorId, postId, content) => {
    const postExists = await prisma.post.count({ where: { id: postId }});
    if (!postExists) throw new AppError('Cannot comment on a post that does not exist.', 404);

    return await prisma.comment.create({
        data: {
            content,
            author: { connect: { id: authorId } },
            post: { connect: { id: postId } }
        },
        // ✅ FIXED: Select only 'id' and 'email' for the comment's author.
        include: { author: { select: { id: true, email: true } } }
    });
};

export const deleteComment = async (authorId, commentId) => {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError('Comment not found.', 404);
    if (comment.authorId !== authorId) throw new AppError('Forbidden: You can only delete your own comments.', 403);

    await prisma.comment.delete({ where: { id: commentId } });
};

export const likePost = async (userId, postId) => {
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId: userId,
        postId: postId,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });
    return { message: 'Post unliked successfully.', data: { liked: false } };
  } else {
    // ✅ FIXED: Use the robust 'connect' syntax for creating the like.
    await prisma.like.create({
      data: {
        user: { connect: { id: userId } },
        post: { connect: { id: postId } }
      },
    });
    return { message: 'Post liked successfully.', data: { liked: true } };
  }
};