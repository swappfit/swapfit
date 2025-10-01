// src/services/bookingService.js
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
// We will need the getOrCreateChargebeeCustomer helper, let's assume it's moved to a shared util or service
// For now, we can redefine it here or import from subscriptionService.
// import { getOrCreateChargebeeCustomer } from './subscriptionService.js'

const prisma = new PrismaClient();

// This helper funtion would ideally be in a shared `chargebeeService.js`
const getOrCreateChargebeeCustomer = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.chargebeeCustomerId) return user.chargebeeCustomerId;
  console.log(`[STUB] Would create Chargebee customer for user: ${user.email}`);
  const dummyChargebeeId = `cb_stub_${user.id}`;
  await prisma.user.update({ where: { id: userId }, data: { chargebeeCustomerId: dummyChargebeeId } });
  return dummyChargebeeId;
};

export const createBookingCheckout = async (userId, { gymId, bookingType }) => {
  const gym = await prisma.gym.findUnique({ where: { id: gymId } });
  if (!gym) throw new AppError('Gym not found.', 404);
  if (gym.status !== 'approved') throw new AppError('This gym is not currently accepting bookings.', 403);

  const price = bookingType === 'daily' ? gym.dailyPassPrice : gym.weeklyPassPrice;
  if (price === null || price <= 0) {
    throw new AppError(`This gym does not offer a ${bookingType} pass for purchase.`, 400);
  }

  const chargebeeCustomerId = await getOrCreateChargebeeCustomer(userId);

  // CHARGEBEE INTEGRATION POINT (STUBBED)
  // In the future, this will call Chargebee's API to create a checkout for a one-time charge.
  // API call: chargebee.hosted_page.checkout_one_time_for_items(...)
  console.log(`[STUB] Would create a one-time Chargebee checkout for customer ${chargebeeCustomerId}`);
  console.log(`[STUB] Details: Gym: ${gym.name}, Type: ${bookingType}, Price: ${price}`);
  
  const dummyCheckoutUrl = `https://your-app.com/test-booking-checkout?gymId=${gymId}&type=${bookingType}&price=${price}`;

  return { checkoutUrl: dummyCheckoutUrl };
};

export const getMyBookings = async (userId) => {
  return await prisma.booking.findMany({
    where: { userId },
    include: { gym: { select: { id: true, name: true, address: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const setGymPassPrices = async (ownerId, gymId, { dailyPassPrice, weeklyPassPrice }) => {
    const gym = await prisma.gym.findFirst({ where: { id: gymId, managerId: ownerId }});
    if (!gym) throw new AppError('Gym not found or you do not have permission to edit it.', 404);

    return await prisma.gym.update({
        where: { id: gymId },
        data: { dailyPassPrice, weeklyPassPrice }
    });
};

