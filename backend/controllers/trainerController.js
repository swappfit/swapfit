// src/controllers/trainerController.js

import * as trainerService from '../services/trainerService.js';

import catchAsync from '../utils/catchAsync.js';

// --- Public Controllers ---
export const getAllTrainers = catchAsync(async (req, res) => {
  const result = await trainerService.getAll(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getTrainerById = catchAsync(async (req, res) => {
  const profile = await trainerService.getById(req.params.id);
  res.status(200).json({ success: true, data: profile });
});


// --- Trainer-Specific Controllers ---
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

export const getMyTrainingPlans = catchAsync(async (req, res) => {
    const plans = await trainerService.getMyTrainingPlans(req.user.id);
    res.status(200).json({ success: true, data: plans });
});

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
