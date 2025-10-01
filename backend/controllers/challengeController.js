// src/controllers/challengeController.js
import * as challengeService from '../services/challengeService.js';
import catchAsync from '../utils/catchAsync.js';

export const getAllChallenges = catchAsync(async (req, res) => {
    const result = await challengeService.getAll(req.query);
    res.status(200).json({ success: true, ...result });
});

export const getChallengeDetails = catchAsync(async (req, res) => {
    const challenge = await challengeService.getById(req.params.id);
    res.status(200).json({ success: true, data: challenge });
});

export const joinChallenge = catchAsync(async (req, res) => {
    const participant = await challengeService.joinChallenge(req.user.id, req.params.id);
    res.status(201).json({ success: true, message: 'Successfully joined challenge.', data: participant });
});

export const leaveChallenge = catchAsync(async (req, res) => {
    await challengeService.leaveChallenge(req.user.id, req.params.id);
    res.status(204).send();
});

export const createChallenge = catchAsync(async (req, res) => {
    const newChallenge = await challengeService.createChallenge(req.user, req.body);
    res.status(201).json({ success: true, message: 'Challenge created successfully.', data: newChallenge });
});

export const deleteChallenge = catchAsync(async (req, res) => {
    await challengeService.deleteChallenge(req.user, req.params.id);
    res.status(204).send();
});
