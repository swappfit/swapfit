// src/services/trainingService.js
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

// Helper to find an exercise by name, or create it if it doesn't exist.
const findOrCreateExercise = async (tx, exerciseName) => {
  const name = exerciseName.trim();
  const existing = await tx.exercise.findUnique({ where: { name } });
  if (existing) return existing;
  return tx.exercise.create({ data: { name, type: 'strength' } }); // Default type
};

export const createLog = async (userId, logData) => {
  const { exercises, ...sessionData } = logData;

  // Use a transaction to ensure either the whole workout is created, or nothing is.
  return prisma.$transaction(async (tx) => {
    // 1. Create the main WorkoutSession
    const session = await tx.workoutSession.create({
      data: { userId, ...sessionData },
    });

    // 2. Create all the related WorkoutLog entries for each exercise
    for (const ex of exercises) {
      if (!ex.name) continue;
      const exerciseRecord = await findOrCreateExercise(tx, ex.name);
      await tx.workoutLog.create({
        data: {
          sessionId: session.id,
          exerciseId: exerciseRecord.id,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          notes: ex.notes,
        },
      });
    }
    return session;
  });
};

export const getLogsByDate = async (userId, dateString) => {
  const startDate = new Date(dateString);
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(dateString);
  endDate.setUTCHours(23, 59, 59, 999);

  return prisma.workoutSession.findMany({
    where: { userId, date: { gte: startDate, lte: endDate } },
    // Include the detailed exercise logs with each session
    include: {
      logs: {
        include: {
          exercise: true, // Also include the name of the exercise
        },
      },
    },
  });
};

export const updateLog = async (userId, logId, updateData) => {
  const workout = await prisma.workoutSession.findFirst({
    where: { id: logId, userId },
  });
  if (!workout) {
    throw new AppError('Workout not found or permission denied.', 404);
  }
  // Note: This simple update only affects the WorkoutSession.
  // A more complex update would handle adding/removing/editing exercises within the log.
  return prisma.workoutSession.update({
    where: { id: logId },
    data: updateData,
  });
};

export const deleteLog = async (userId, logId) => {
  const workout = await prisma.workoutSession.findFirst({
    where: { id: logId, userId },
  });
  if (!workout) {
    throw new AppError('Workout not found or permission denied.', 404);
  }
  // Deleting the WorkoutSession will cascade and delete all its related WorkoutLogs
  return prisma.workoutSession.delete({ where: { id: logId } });
};