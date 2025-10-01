// src/controllers/trainingController.js
import * as trainingService from '../services/trainingService.js';
import catchAsync from '../utils/catchAsync.js';

export const logWorkout = catchAsync(async (req, res) => {
  const newWorkout = await trainingService.createLog(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Workout logged successfully.', data: newWorkout });
});

export const getWorkoutsByDate = catchAsync(async (req, res) => {
  const { date } = req.params;
  const workouts = await trainingService.getLogsByDate(req.user.id, date);
  res.status(200).json({ success: true, data: workouts });
});

export const updateWorkout = catchAsync(async (req, res) => {
  const { logId } = req.params;
  const updatedWorkout = await trainingService.updateLog(req.user.id, logId, req.body);
  res.status(200).json({ success: true, message: 'Workout updated successfully.', data: updatedWorkout });
});

export const deleteWorkout = catchAsync(async (req, res) => {
  const { logId } = req.params;
  await trainingService.deleteLog(req.user.id, logId);
  res.status(204).send();
});