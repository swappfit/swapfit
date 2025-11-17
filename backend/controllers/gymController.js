// src/controllers/gymController.js

import * as gymService from '../services/gymService.js';
import * as authService from '../services/authService.js'; // Added this import
import catchAsync from '../utils/catchAsync.js';

// Helper function to get user ID from either JWT or Auth0
const getUserId = async (req) => {
  // If we have a user object from authGatekeeper, use it
  if (req.user?.id) {
    return req.user.id;
  }
  
  // If we have an Auth0 payload, get the user from the database
  if (req.auth?.payload) {
    const user = await authService.getUserByAuth0Id(req.auth.payload.sub);
    if (!user) throw new Error('User not found for the given Auth0 ID.');
    return user.id;
  }
  
  throw new Error('Authentication failed: No user identifier found in request.');
};

// --- Public Controllers ---
export const getAllGyms = catchAsync(async (req, res) => {
   console.log('[gymController] getAllGyms called with query:', req.query);
  const result = await gymService.getAll(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getGymById = catchAsync(async (req, res) => {
  const gym = await gymService.getById(req.params.id);
  res.status(200).json({ success: true, data: gym });
});

export const getGymPlans = catchAsync(async (req, res) => {
  const plans = await gymService.getPlans(req.params.gymId);
  res.status(200).json({ success: true, data: plans });
});

export const getAssignedTrainers = catchAsync(async (req, res) => {
    const trainers = await gymService.getAssignedTrainers(req.params.gymId);
    res.status(200).json({ success: true, data: trainers });
});

// ✅ ADD THIS NEW CONTROLLER
export const getGymsByPlanIds = catchAsync(async (req, res) => {
  const { planIds } = req.body;
  if (!planIds || !Array.isArray(planIds)) {
    return res.status(400).json({ success: false, message: 'planIds must be an array.' });
  }
  const gyms = await gymService.getGymsByPlanIds(planIds);
  res.status(200).json({ success: true, data: gyms });
});

// --- Member Controllers ---
export const checkIn = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const newCheckIn = await gymService.checkIn(userId, req.body.gymId);
  res.status(201).json({ success: true, message: 'Checked in successfully.', data: newCheckIn });
});

export const checkOut = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const updatedCheckIn = await gymService.checkOut(userId, req.params.checkInId);
  res.status(200).json({ success: true, message: 'Checked out successfully.', data: updatedCheckIn });
});

// --- Owner Controllers ---
export const updateGym = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const updatedGym = await gymService.update(req.params.id, userId, req.body);
  res.status(200).json({ success: true, message: 'Gym updated successfully.', data: updatedGym });
});

export const getOwnerDashboard = catchAsync(async (req, res, next) => {
  const userId = await getUserId(req);
  const dashboardData = await gymService.getGymOwnerDashboard(userId);
  res.status(200).json({ success: true, data: dashboardData });
});

export const assignTrainer = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  await gymService.assignTrainer(req.params.gymId, userId, req.body.trainerUserId);
  res.status(200).json({ success: true, message: 'Trainer assigned successfully.' });
});

export const unassignTrainer = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  await gymService.unassignTrainer(req.params.gymId, userId, req.body.trainerUserId);
  res.status(200).json({ success: true, message: 'Trainer unassigned successfully.' });
});

export const createGymPlan = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const { gymId } = req.params;
  const newPlan = await gymService.createPlan(gymId, userId, req.body);
  res.status(201).json({ success: true, message: 'Plan created successfully.', data: newPlan });
});

export const updateGymPlan = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const { planId } = req.params;
  const updatedPlan = await gymService.updatePlan(planId, userId, req.body);
  res.status(200).json({ success: true, message: 'Plan updated successfully.', data: updatedPlan });
});

export const deleteGymPlan = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const { planId } = req.params;
  await gymService.deletePlan(planId, userId);
  res.status(200).json({ success: true, message: 'Plan deleted successfully.' });
});

export const getMyGymProfile = catchAsync(async (req, res) => {
    const userId = await getUserId(req);
    const gym = await gymService.getMyGym(userId);
    res.status(200).json({ success: true, data: gym });
});

export const getGymMembers = catchAsync(async (req, res) => {
  // The owner's ID comes securely from their authentication token.
  const userId = await getUserId(req);
  const members = await gymService.getMyMembers(userId);
  res.status(200).json({ success: true, data: members });
});
// Add these new controller functions
export const getPendingCheckIns = async (req, res, next) => {
    try {
        const ownerId = req.user.id;
        const gym = await prisma.gym.findFirst({ where: { managerId: ownerId } });
        if (!gym) return res.status(404).json({ message: 'Gym not found' });

        const pendingCheckIns = await gymService.getPendingCheckIns(gym.id);
        res.status(200).json(pendingCheckIns);
    } catch (error) {
        next(error);
    }
};

export const verifyCheckIn = async (req, res, next) => {
    try {
        const { checkInId } = req.params;
        const verifierId = req.user.id;
        const updatedCheckIn = await gymService.updateCheckInStatus(checkInId, verifierId, 'verified');
        res.status(200).json(updatedCheckIn);
    } catch (error) {
        next(error);
    }
};

export const rejectCheckIn = async (req, res, next) => {
    try {
        const { checkInId } = req.params;
        const verifierId = req.user.id;
        const updatedCheckIn = await gymService.updateCheckInStatus(checkInId, verifierId, 'rejected');
        res.status(200).json(updatedCheckIn);
    } catch (error) {
        next(error);
    }
};