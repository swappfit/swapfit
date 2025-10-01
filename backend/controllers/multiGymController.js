// src/controllers/multiGymController.js
import * as multiGymService from '../services/multiGymService.js';
import catchAsync from '../utils/catchAsync.js';

// --- Member Controllers ---
export const getAllTiers = catchAsync(async (req, res) => {
    const tiers = await multiGymService.getTiersForDiscovery();
    res.status(200).json({ success: true, data: tiers });
});

export const getTierDetails = catchAsync(async (req, res) => {
    const tier = await multiGymService.getTierDetails(req.params.tierId);
    res.status(200).json({ success: true, data: tier });
});

export const getNearbyGymsInTier = catchAsync(async (req, res) => {
    const gyms = await multiGymService.findNearbyGymsInTier(req.user.id, req.query);
    res.status(200).json({ success: true, data: gyms });
});

// --- Admin Controllers ---
export const createTier = catchAsync(async (req, res) => {
    const newTier = await multiGymService.createTier(req.body);
    res.status(201).json({ success: true, data: newTier });
});

export const updateTier = catchAsync(async (req, res) => {
    const updatedTier = await multiGymService.updateTier(req.params.tierId, req.body);
    res.status(200).json({ success: true, data: updatedTier });
});

export const deleteTier = catchAsync(async (req, res) => {
    await multiGymService.deleteTier(req.params.tierId);
    res.status(204).send();
});

export const assignGymToTier = catchAsync(async (req, res) => {
    const { tierId, gymId } = req.body;
    await multiGymService.assignGymToTier(tierId, gymId);
    res.status(200).json({ success: true, message: 'Gym assigned to tier successfully.' });
});

export const removeGymFromTier = catchAsync(async (req, res) => {
    const { gymId } = req.body;
    await multiGymService.removeGymFromTier(gymId);
    res.status(200).json({ success: true, message: 'Gym removed from tier successfully.' });
});

