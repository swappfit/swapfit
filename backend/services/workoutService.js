import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

export const logSession = async (userId, sessionData) => {
  const { 
    date, exercises, workoutName, workoutType, duration, 
    intensity, notes, muscleGroups
  } = sessionData;

  try {
    return await prisma.$transaction(async (tx) => {
      // For each exercise in the session, upsert it to ensure it exists in the database
      const exerciseIds = await Promise.all(
        exercises.map(async (exerciseDetail) => {
          const exerciseRecord = await tx.exercise.upsert({
            where: { name: exerciseDetail.name },
            update: {
              type: exerciseDetail.type,
            },
            create: {
              name: exerciseDetail.name,
              type: exerciseDetail.type,
            },
          });
          return exerciseRecord.id;
        })
      );

      // Create the workout session
      const allEquipment = exercises.flatMap(ex => ex.equipment);
      const uniqueEquipment = [...new Set(allEquipment)];

      const session = await tx.workoutSession.create({
        data: {
          userId,
          date: date ? new Date(date) : new Date(),
          workoutName,
          workoutType,
          duration,
          intensity,
          notes,
          muscleGroups: muscleGroups || [],
          equipment: uniqueEquipment || [],
        },
      });

      // Create the WorkoutLog entries to link the session with the exercises
      const logData = exerciseIds.map(exerciseId => ({
        sessionId: session.id,
        exerciseId: exerciseId,
      }));
      await tx.workoutLog.createMany({ data: logData });

      // Return the complete session with logs and exercises
      return await tx.workoutSession.findUnique({
          where: { id: session.id },
          include: { logs: { include: { exercise: true } } }
      });
    });
  } catch (error) {
    console.error("Error in logSession service:", error);
    throw new AppError('Failed to log workout session.', 500);
  }
}

export const getHistory = async (userId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  
  const [sessions, total] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId },
      include: {
        logs: {
          include: {
            exercise: true
          }
        }
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit
    }),
    prisma.workoutSession.count({ where: { userId } })
  ]);

  return {
    data: sessions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export const deleteSession = async (userId, sessionId) => {
  // First check if the session exists and belongs to the user
  const session = await prisma.workoutSession.findFirst({
    where: {
      id: sessionId,
      userId
    }
  });

  if (!session) {
    throw new AppError('Workout session not found', 404);
  }

  // Delete the workout logs associated with the session
  await prisma.workoutLog.deleteMany({
    where: { sessionId }
  });

  // Delete the workout session
  await prisma.workoutSession.delete({
    where: { id: sessionId }
  });

  return { success: true };
}

export const deleteExerciseFromSession = async (userId, sessionId, exerciseId) => {
  // First check if the session exists and belongs to the user
  const session = await prisma.workoutSession.findFirst({
    where: {
      id: sessionId,
      userId
    },
    include: {
      logs: {
        include: {
          exercise: true
        }
      }
    }
  });

  if (!session) {
    throw new AppError('Workout session not found', 404);
  }

  // Check if the exercise exists in the session
  const exerciseLog = session.logs.find(log => log.exerciseId === exerciseId);
  if (!exerciseLog) {
    throw new AppError('Exercise not found in this session', 404);
  }

  // Delete the workout log entry
  await prisma.workoutLog.delete({
    where: {
      id: exerciseLog.id
    }
  });

  // Get remaining exercises to update session data
  const remainingLogs = await prisma.workoutLog.findMany({
    where: { sessionId },
    include: { exercise: true }
  });

  // Update session with new equipment and muscle groups if there are remaining exercises
  if (remainingLogs.length > 0) {
    const remainingExercises = remainingLogs.map(log => log.exercise);
    const allEquipment = remainingExercises.flatMap(ex => ex.equipment || []);
    const uniqueEquipment = [...new Set(allEquipment)];
    
    const allMuscleGroups = remainingExercises.flatMap(ex => ex.type ? [ex.type] : []);
    const uniqueMuscleGroups = [...new Set(allMuscleGroups)];

    await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        equipment: uniqueEquipment,
        muscleGroups: uniqueMuscleGroups
      }
    });
  } else {
    // If no exercises left, clear equipment and muscle groups
    await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        equipment: [],
        muscleGroups: []
      }
    });
  }

  return { success: true };
}