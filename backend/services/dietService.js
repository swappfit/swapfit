import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
const prisma = new PrismaClient();

export const createLog = async (userId, logData) => {
    console.log("[DietService] Creating diet log in database...");

    const dataForDb = {
        userId: userId,
        mealName: logData.mealName,
        mealType: logData.mealType,
        calories: logData.calories,
        protein: logData.protein ?? null,
        carbs: logData.carbs ?? null,
        fats: logData.fats ?? null,
        fiber: logData.fiber ?? null,
        sugar: logData.sugar ?? null,
        photoUrl: logData.photoUrl ?? null,
        notes: logData.notes ?? null,
    };

    if (logData.createdAt) {
        dataForDb.createdAt = new Date(logData.createdAt);
    }

    // FIX: Add a try...catch block to log the specific Prisma error
    try {
        const newLog = await prisma.dietLog.create({
            data: dataForDb,
        });

        console.log("[DietService] Successfully created diet log."); // This will now run if successful
        return newLog;
    } catch (error) {
        // This will now print the detailed error from Prisma to your console
        console.error("❌ [DietService] Prisma Error creating diet log:", error);
        
        // Re-throw the error so your global error handler can still catch it
        // and send a proper HTTP response.
        throw new AppError('Failed to create diet log in the database.', 500);
    }
};

export const getLogsByDate = async (userId, dateString) => {
    const startDate = new Date(dateString);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(dateString);
    endDate.setUTCHours(23, 59, 59, 999);
    const logs = await prisma.dietLog.findMany({
        where: {
            userId,
            createdAt: { gte: startDate, lte: endDate },
        },
        orderBy: { createdAt: 'asc' },
    });
    const summary = logs.reduce((acc, log) => {
        acc.totalCalories += log.calories;
        acc.totalProtein += log.protein || 0;
        acc.totalCarbs += log.carbs || 0;
        acc.totalFats += log.fats || 0;
        return acc;
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 });
    return { logs, summary };
};

export const updateLog = async (userId, logId, updateData) => {
    const log = await prisma.dietLog.findFirst({
        where: { id: logId, userId: userId }
    });

    if (!log) {
        throw new AppError('Diet log not found or you do not have permission to edit it.', 404);
    }

    return await prisma.dietLog.update({
        where: { id: logId },
        data: updateData
    });
};

export const deleteLog = async (userId, logId) => {
    const log = await prisma.dietLog.findFirst({
        where: { id: logId, userId: userId }
    });

    if (!log) {
        throw new AppError('Diet log not found or you do not have permission to delete it.', 404);
    }

    await prisma.dietLog.delete({
        where: { id: logId }
    });
};