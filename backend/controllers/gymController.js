// src/controllers/gymController.js

import * as gymService from '../services/gymService.js';

import catchAsync from '../utils/catchAsync.js';

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

// --- Member Controllers ---
export const checkIn = catchAsync(async (req, res) => {
  const newCheckIn = await gymService.checkIn(req.user.id, req.body.gymId);
  res.status(201).json({ success: true, message: 'Checked in successfully.', data: newCheckIn });
});

export const checkOut = catchAsync(async (req, res) => {
  const updatedCheckIn = await gymService.checkOut(req.user.id, req.params.checkInId);
  res.status(200).json({ success: true, message: 'Checked out successfully.', data: updatedCheckIn });
});

// --- Owner Controllers ---
export const updateGym = catchAsync(async (req, res) => {
  const updatedGym = await gymService.update(req.params.id, req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Gym updated successfully.', data: updatedGym });
});

export const getOwnerDashboard = catchAsync(async (req, res, next) => {
  const dashboardData = await gymService.getGymOwnerDashboard(req.user.id);
  res.status(200).json({ success: true, data: dashboardData });
});


export const assignTrainer = catchAsync(async (req, res) => {
  await gymService.assignTrainer(req.params.gymId, req.user.id, req.body.trainerUserId);
  res.status(200).json({ success: true, message: 'Trainer assigned successfully.' });
});

export const unassignTrainer = catchAsync(async (req, res) => {
  await gymService.unassignTrainer(req.params.gymId, req.user.id, req.body.trainerUserId);
  res.status(200).json({ success: true, message: 'Trainer unassigned successfully.' });
});

export const createGymPlan = catchAsync(async (req, res) => {
  const { gymId } = req.params;
  const newPlan = await gymService.createPlan(gymId, req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Plan created successfully.', data: newPlan });
});

export const updateGymPlan = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const updatedPlan = await gymService.updatePlan(planId, req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Plan updated successfully.', data: updatedPlan });
});

export const deleteGymPlan = catchAsync(async (req, res) => {
  const { planId } = req.params;
  await gymService.deletePlan(planId, req.user.id);
  res.status(200).json({ success: true, message: 'Plan deleted successfully.' });
});
export const getMyGymProfile = catchAsync(async (req, res) => {
    const gym = await gymService.getMyGym(req.user.id);
    res.status(200).json({ success: true, data: gym });
});

export const getGymMembers = catchAsync(async (req, res) => {
  // The owner's ID comes securely from their authentication token.
  const members = await gymService.getMyMembers(req.user.id);
  res.status(200).json({ success: true, data: members });
});
