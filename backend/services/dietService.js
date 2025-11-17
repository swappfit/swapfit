// src/services/dietService.js
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
const prisma = new PrismaClient();

export const createLog = async (userId, logData) => {
    console.log("[DietService] Creating diet log in database...");
    console.log("[DietService] Log data received:", logData);

    // FIX: Ensure we're using the correct field name
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
        notes: logData.notes ?? null,
        // FIX: Use photoUrl field from the incoming data
        photoUrl: logData.photoUrl || logData.photo || null,
    };

    console.log("[DietService] Data for database:", dataForDb);

    if (logData.createdAt) {
        dataForDb.createdAt = new Date(logData.createdAt);
    }

    // FIX: Add a try...catch block to log specific Prisma error
    try {
        const newLog = await prisma.dietLog.create({
            data: dataForDb,
        });

        console.log("[DietService] Successfully created diet log with photoUrl:", newLog.photoUrl);
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
    
    // FIX: Add photoUrl to the select query
    const logs = await prisma.dietLog.findMany({
        where: {
            userId,
            createdAt: { gte: startDate, lte: endDate },
        },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            userId: true,
            mealName: true,
            mealType: true,
            calories: true,
            protein: true,
            carbs: true,
            fats: true,
            fiber: true,
            sugar: true,
            photoUrl: true, // FIX: Explicitly include photoUrl
            notes: true,
            createdAt: true,
        }
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

    // FIX: Ensure we're using the correct field name for photoUrl
    const updateDataForDb = {
        ...updateData,
        // Map photo field to photoUrl for database
        photoUrl: updateData.photoUrl || updateData.photo || log.photoUrl,
    };

    // Remove the photo field if it exists (we use photoUrl in DB)
    if (updateDataForDb.photo) {
        delete updateDataForDb.photo;
    }

    return await prisma.dietLog.update({
        where: { id: logId },
        data: updateDataForDb
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