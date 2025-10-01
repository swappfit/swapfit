// src/services/multiGymService.js
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
const prisma = new PrismaClient();
// --- Member-Facing Services ---
export const getTiersForDiscovery = async () => {
return await prisma.multiGymTier.findMany({
include: { _count: { select: { gyms: true } } }, // Show how many gyms are in each tier
orderBy: { price: 'asc' }
});
};
export const getTierDetails = async (tierId) => {
const tier = await prisma.multiGymTier.findUnique({
where: { id: tierId },
include: { gyms: { select: { id: true, name: true, address: true, badges: true } } }
});
if (!tier) throw new AppError('Multi-gym tier not found.', 404);
return tier;
};
export const findNearbyGymsInTier = async (userId, { lat, lon, radius }) => {
const activeSub = await prisma.subscription.findFirst({
where: { userId, status: 'active', multiGymTierId: { not: null } }
});
if (!activeSub) throw new AppError('No active multi-gym subscription found.', 403);
code
Code
return await prisma.$queryRaw`
    SELECT id, name, address, "multiGymTierId", badges,
      ( 6371 * acos( cos( radians(${lat}) ) * cos( radians(latitude) ) * cos( radians(longitude) - radians(${lon}) ) + sin( radians(${lat}) ) * sin( radians(latitude) ) ) ) AS distance
    FROM "Gym"
    WHERE "multiGymTierId" = ${activeSub.multiGymTierId} AND
    ( 6371 * acos( cos( radians(${lat}) ) * cos( radians(latitude) ) * cos( radians(longitude) - radians(${lon}) ) + sin( radians(${lat}) ) * sin( radians(latitude) ) ) ) < ${radius}
    ORDER BY distance;
`;
};
// --- Admin-Facing Services ---
export const createTier = async (tierData) => {
return await prisma.multiGymTier.create({ data: tierData });
};
export const updateTier = async (tierId, updateData) => {
await getTierDetails(tierId); // Verify tier exists
return await prisma.multiGymTier.update({ where: { id: tierId }, data: updateData });
};
export const deleteTier = async (tierId) => {
await getTierDetails(tierId); // Verify tier exists
// You might add a check here to prevent deleting a tier with active subscribers
await prisma.multiGymTier.delete({ where: { id: tierId } });
};
export const assignGymToTier = async (tierId, gymId) => {
// Verify both exist before trying to connect them
await getTierDetails(tierId);
const gym = await prisma.gym.findUnique({ where: { id: gymId } });
if (!gym) throw new AppError('Gym not found.', 404);
code
Code
return await prisma.gym.update({
    where: { id: gymId },
    data: { multiGymTier: { connect: { id: tierId } } }
});
};
export const removeGymFromTier = async (gymId) => {
const gym = await prisma.gym.findUnique({ where: { id: gymId } });
if (!gym) throw new AppError('Gym not found.', 404);
code
Code
return await prisma.gym.update({
    where: { id: gymId },
    data: { multiGymTier: { disconnect: true } }
});
};

