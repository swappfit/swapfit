import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

export const createLog = async (userId, logData) => {
    try {
        console.log("[DietService] Creating diet log in database...");
        console.log("[DietService] Log data:", logData);

        // Validate required fields
        if (!logData.mealName || !logData.calories) {
            throw new AppError('Meal name and calories are required', 400);
        }

        const dataForDb = {
            userId: userId,
            mealName: logData.mealName.trim(),
            mealType: logData.mealType || 'breakfast',
            calories: parseInt(logData.calories) || 0,
            protein: parseInt(logData.protein) || 0,
            carbs: parseInt(logData.carbs) || 0,
            fats: parseInt(logData.fats) || 0,
            fiber: parseInt(logData.fiber) || null,
            sugar: parseInt(logData.sugar) || null,
            photoUrl: logData.photoUrl || null,
            notes: logData.notes || null,
        };

        // Add createdAt if provided
        if (logData.createdAt) {
            dataForDb.createdAt = new Date(logData.createdAt);
        }

        console.log("[DietService] Data for DB:", dataForDb);

        const newLog = await prisma.dietLog.create({
            data: dataForDb,
        });

        console.log("[DietService] Successfully created diet log:", newLog);
        return newLog;
    } catch (error) {
        console.error("❌ [DietService] Error creating diet log:", error);
        
        // Handle Prisma validation errors
        if (error.code === 'P2002') {
            throw new AppError('A diet log with this data already exists.', 409);
        }
        
        // Handle Prisma foreign key errors
        if (error.code === 'P2003') {
            throw new AppError('Invalid user ID provided.', 400);
        }
        
        // Handle Prisma record not found
        if (error.code === 'P2025') {
            throw new AppError('User not found.', 404);
        }
        
        // Re-throw AppError or create a new one
        if (error instanceof AppError) {
            throw error;
        }
        
        throw new AppError('Failed to create diet log in the database.', 500);
    }
};

export const getLogsByDate = async (userId, dateString) => {
    try {
        console.log("[DietService] Fetching logs for user:", userId, "date:", dateString);
        
        // Validate date format
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new AppError('Invalid date format', 400);
        }
        
        const startDate = new Date(dateString);
        startDate.setUTCHours(0, 0, 0, 0);
        const endDate = new Date(dateString);
        endDate.setUTCHours(23, 59, 59, 999);
        
        console.log("[DietService] Date range:", { startDate, endDate });
        
        const logs = await prisma.dietLog.findMany({
            where: {
                userId,
                createdAt: { 
                    gte: startDate, 
                    lte: endDate 
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        
        console.log("[DietService] Found logs:", logs.length);
        
        // Calculate summary
        const summary = logs.reduce((acc, log) => {
            acc.totalCalories += log.calories;
            acc.totalProtein += log.protein || 0;
            acc.totalCarbs += log.carbs || 0;
            acc.totalFats += log.fats || 0;
            return acc;
        }, { 
            totalCalories: 0, 
            totalProtein: 0, 
            totalCarbs: 0, 
            totalFats: 0 
        });
        
        return { logs, summary };
    } catch (error) {
        console.error("❌ [DietService] Error fetching diet logs:", error);
        
        if (error instanceof AppError) {
            throw error;
        }
        
        throw new AppError('Failed to fetch diet logs.', 500);
    }
};

export const updateLog = async (userId, logId, updateData) => {
    try {
        console.log("[DietService] Updating log:", logId, "for user:", userId);
        
        // First check if the log exists and belongs to the user
        const log = await prisma.dietLog.findFirst({
            where: { id: logId, userId: userId }
        });

        if (!log) {
            throw new AppError('Diet log not found or you do not have permission to edit it.', 404);
        }
        
        // Prepare update data
        const updateFields = {};
        
        // Only include fields that are actually being updated
        if (updateData.mealName !== undefined) updateFields.mealName = updateData.mealName.trim();
        if (updateData.mealType !== undefined) updateFields.mealType = updateData.mealType;
        if (updateData.calories !== undefined) updateFields.calories = parseInt(updateData.calories) || 0;
        if (updateData.protein !== undefined) updateFields.protein = parseInt(updateData.protein) || 0;
        if (updateData.carbs !== undefined) updateFields.carbs = parseInt(updateData.carbs) || 0;
        if (updateData.fats !== undefined) updateFields.fats = parseInt(updateData.fats) || 0;
        if (updateData.fiber !== undefined) updateFields.fiber = parseInt(updateData.fiber) || null;
        if (updateData.sugar !== undefined) updateFields.sugar = parseInt(updateData.sugar) || null;
        if (updateData.photoUrl !== undefined) updateFields.photoUrl = updateData.photoUrl;
        if (updateData.notes !== undefined) updateFields.notes = updateData.notes;
        
        console.log("[DietService] Update fields:", updateFields);
        
        const updatedLog = await prisma.dietLog.update({
            where: { id: logId },
            data: updateFields
        });
        
        console.log("[DietService] Successfully updated log:", updatedLog);
        return updatedLog;
    } catch (error) {
        console.error("❌ [DietService] Error updating diet log:", error);
        
        if (error instanceof AppError) {
            throw error;
        }
        
        throw new AppError('Failed to update diet log.', 500);
    }
};

export const deleteLog = async (userId, logId) => {
    try {
        console.log("[DietService] Deleting log:", logId, "for user:", userId);
        
        // First check if the log exists and belongs to the user
        const log = await prisma.dietLog.findFirst({
            where: { id: logId, userId: userId }
        });

        if (!log) {
            throw new AppError('Diet log not found or you do not have permission to delete it.', 404);
        }
        
        await prisma.dietLog.delete({
            where: { id: logId }
        });
        
        console.log("[DietService] Successfully deleted log");
    } catch (error) {
        console.error("❌ [DietService] Error deleting diet log:", error);
        
        if (error instanceof AppError) {
            throw error;
        }
        
        throw new AppError('Failed to delete diet log.', 500);
    }
};