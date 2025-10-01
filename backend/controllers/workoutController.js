import * as workoutService from '../services/workoutService.js';
import * as authService from '../services/authService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

const getUserId = async (req) => {
  if (req.auth?.payload) {
    const user = await authService.getUserByAuth0Id(req.auth.payload.sub);
    if (!user) throw new AppError('User not found in database.', 404);
    return user.id;
  }
  if (req.user?.id) {
    return req.user.id;
  }
  throw new AppError('Authentication error: User ID could not be determined.', 401);
};

export const logWorkoutSession = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const newSession = await workoutService.logSession(userId, req.body);
  res.status(201).json({ success: true, message: 'Workout logged successfully.', data: newSession });
});

export const getWorkoutHistory = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const history = await workoutService.getHistory(userId, req.query);
  res.status(200).json({ success: true, data: history.data, pagination: history.pagination });
});

export const deleteWorkoutSession = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const result = await workoutService.deleteSession(userId, req.params.sessionId);
  res.status(200).json({ success: true, message: 'Workout session deleted successfully.', data: result });
});

export const deleteExerciseFromSession = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const result = await workoutService.deleteExerciseFromSession(userId, req.params.sessionId, req.params.exerciseId);
  res.status(200).json({ success: true, message: 'Exercise removed from session successfully.', data: result });
});