// src/services/challengeService.js
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
const prisma = new PrismaClient();

/**
 * @description Fetches a paginated list of active or upcoming challenges.
 */
export const getAll = async ({ page, limit }) => {
    const skip = (page - 1) * limit;
    const whereClause = { endDate: { gte: new Date() } }; // Only show challenges that haven't ended yet

    const [challenges, total] = await prisma.$transaction([
        prisma.challenge.findMany({
            where: whereClause,
            orderBy: { startDate: 'asc' },
            include: { _count: { select: { participants: true } } },
            skip,
            take: limit
        }),
        prisma.challenge.count({ where: whereClause })
    ]);
    return { data: challenges, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

/**
 * @description Gets details for a single challenge, including the leaderboard.
 */
export const getById = async (challengeId) => {
    const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        include: {
            participants: {
                orderBy: { score: 'desc' },
                take: 100, // Limit leaderboard to top 100
                include: { user: { select: { id: true, email: true } } }
            }
        }
    });
    if (!challenge) throw new AppError('Challenge not found.', 404);
    return challenge;
};

/**
 * @description Allows a user to join an active challenge.
 */
export const joinChallenge = async (userId, challengeId) => {
    const challenge = await prisma.challenge.findFirst({
        where: { id: challengeId, endDate: { gte: new Date() } }
    });
    if (!challenge) throw new AppError('Challenge not found or has already ended.', 404);

    const existingParticipant = await prisma.challengeParticipant.findUnique({
        where: { userId_challengeId: { userId, challengeId } }
    });
    if (existingParticipant) throw new AppError('You have already joined this challenge.', 409);

    return await prisma.challengeParticipant.create({
        data: { userId, challengeId, score: 0 }
    });
};

/**
 * @description Allows a user to leave a challenge.
 */
export const leaveChallenge = async (userId, challengeId) => {
    const participant = await prisma.challengeParticipant.findUnique({
        where: { userId_challengeId: { userId, challengeId } }
    });
    if (!participant) throw new AppError("You are not a participant in this challenge.", 404);

    await prisma.challengeParticipant.delete({
        where: { userId_challengeId: { userId, challengeId } }
    });
};

/**
 * @description Creates a new challenge, linking it to a Gym Owner or Trainer if applicable.
 */
export const createChallenge = async (user, challengeData) => {
  const { role, id: userId } = user;
  let hostingData = {};

  if (role === 'GYM_OWNER') {
    const gym = await prisma.gym.findFirst({ where: { managerId: userId } });
    if (!gym) throw new AppError('You must manage a gym to host a challenge.', 403);
    hostingData.hostedByGymId = gym.id;
  } 
  else if (role === 'TRAINER') {
    const trainerProfile = await prisma.trainerProfile.findUnique({ where: { userId } });
    if (!trainerProfile) throw new AppError('Your trainer profile was not found.', 404);
    hostingData.hostedByTrainerId = trainerProfile.id;
  } 
  else if (role !== 'ADMIN' && !user.isAdmin) {
    throw new AppError('Forbidden: You do not have permission to create challenges.', 403);
  }

  return await prisma.challenge.create({
    data: {
      creatorId: userId,
      ...challengeData,
      ...hostingData,
    },
  });
};

/**
 * @description Deletes a challenge, verifying ownership (creator or admin).
 */
export const deleteChallenge = async (user, challengeId) => {
    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId }});
    if (!challenge) throw new AppError('Challenge not found.', 404);

    if (challenge.creatorId !== user.id && !user.isAdmin) {
        throw new AppError('Forbidden: You do not have permission to delete this challenge.', 403);
    }

    await prisma.$transaction([
        prisma.challengeParticipant.deleteMany({ where: { challengeId } }),
        prisma.challenge.delete({ where: { id: challengeId } }),
    ]);
};

