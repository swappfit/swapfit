// src/controllers/trainerController.js
import * as trainerService from '../services/trainerService.js';
import { PrismaClient } from '@prisma/client';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

// --- Public Controllers ---
export const getAllTrainers = catchAsync(async (req, res) => {
  const result = await trainerService.getAll(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getTrainerById = catchAsync(async (req, res) => {
  console.log(`[Controller] Getting trainer by ID: ${req.params.id}`);
  const profile = await trainerService.getById(req.params.id);
  res.status(200).json({ success: true, data: profile });
});

// Add a new controller to get trainer by trainerId (not userId)
export const getTrainerByTrainerId = catchAsync(async (req, res) => {
  console.log(`[Controller] Getting trainer by trainer ID: ${req.params.id}`);
  const profile = await prisma.trainerProfile.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, email: true } },
      plans: { orderBy: { price: 'asc' } },
      gyms: { select: { id: true, name: true } },
    },
  });
  
  if (!profile) {
    throw new AppError('Trainer not found.', 404);
  }
  
  res.status(200).json({ success: true, data: profile });
});

export const getTrainersByPlanIds = catchAsync(async (req, res) => {
  const { planIds } = req.body;
  console.log('[Trainer Controller] Received plan IDs:', planIds);
  const trainers = await trainerService.getTrainersByPlanIds(planIds);
  console.log('[Trainer Controller] Returning trainers:', trainers.length);
  res.status(200).json({ success: true, data: trainers });
});

// --- Trainer-Specific Controllers ---

// ✅ FINAL, DEFINITIVE CONTROLLER FUNCTION ✅
export const getMyProfile = catchAsync(async (req, res) => {
  // Log the user ID from the request for debugging
  console.log(`[Trainer Controller] Received request for profile. User ID from token: ${req.user.id}`);

  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: 'Authentication failed: User ID not found in token.' });
  }

  // Ensure user ID is properly formatted (pad if necessary)
  const userId = req.user.id.padEnd(25, '0').substring(0, 25);
  console.log(`[Trainer Controller] Formatted user ID: ${userId}`);

  // ✅ ROBUST FIX: Find the trainer profile by querying through the User relation.
  // This bypasses any potential `userId` mismatch between the token and the profile table.
  const profile = await prisma.trainerProfile.findFirst({
    where: {
      user: {
        id: userId
      }
    },
    include: {
      user: { 
        select: { 
          id: true, 
          email: true
        } 
      },
      plans: { 
        orderBy: { price: 'asc' } 
      },
      gyms: { 
        select: { 
          id: true, 
          name: true 
        } 
      },
    },
  });

  if (!profile) {
    console.log(`[Trainer Controller] FAILED: No trainer profile found for user ID: ${userId}`);
    // Provide a more helpful error message
    throw new AppError('Your trainer profile could not be found. It may not have been created correctly. Please contact support or try completing your profile again.', 404);
  }
  
  console.log(`[Trainer Controller] SUCCESS: Found trainer profile for user: ${userId}, profileId: ${profile.id}`);
  
  // ✅ ADD THIS FINAL LOG TO SEE THE EXACT OBJECT BEING SENT
  console.log('[Trainer Controller] About to send this profile object to frontend:', JSON.stringify(profile, null, 2));
  
  res.status(200).json({ success: true, data: profile });
});

export const updateTrainerProfile = catchAsync(async (req, res) => {
  const updatedProfile = await trainerService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Profile updated successfully.', data: updatedProfile });
});

export const getTrainerDashboard = catchAsync(async (req, res) => {
  const dashboardData = await trainerService.getDashboard(req.user.id);
  res.status(200).json({ success: true, data: dashboardData });
});

export const getSubscribedMembers = catchAsync(async (req, res) => {
  const subscribers = await trainerService.getSubscribers(req.user.id);
  res.status(200).json({ success: true, data: subscribers });
});

export const createTrainingPlan = catchAsync(async (req, res) => {
  const newPlan = await trainerService.createTrainingPlan(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Training plan created.', data: newPlan });
});

export const getMyTrainingPlans = async (req, res) => {
    const plans = await trainerService.getMyTrainingPlans(req.user.id);
    res.status(200).json({ success: true, data: plans });
};

export const updateTrainingPlan = catchAsync(async (req, res) => {
    const { planId } = req.params;
    const updatedPlan = await trainerService.updateTrainingPlan(req.user.id, planId, req.body);
    res.status(200).json({ success: true, message: 'Training plan updated.', data: updatedPlan});
});

export const assignPlanToMember = catchAsync(async (req, res) => {
  const { planId, memberId } = req.body;
  const assignment = await trainerService.assignPlanToMember(req.user.id, planId, memberId);
  res.status(201).json({ success: true, message: 'Plan assigned successfully.', data: assignment });
});

export const updatePlanTrial = catchAsync(async (req, res) => {
    const { planId } = req.params;
    const updatedPlan = await trainerService.updatePlanTrial(req.user.id, planId, req.body);
    res.status(200).json({ success: true, message: 'Trial settings updated.', data: updatedPlan });
});