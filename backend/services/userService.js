import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

/**
 * Changes the password for a logged-in user.
 */
export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  // Ensure user ID is properly formatted (pad if necessary)
  const formattedUserId = userId.padEnd(25, '0').substring(0, 25);
  
  const user = await prisma.user.findUnique({ where: { id: formattedUserId } });
  if (!user || !user.password) {
    throw new AppError('Password change is not available for this account.', 403);
  }
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError('The current password you entered is incorrect.', 401);
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: formattedUserId },
    data: { password: hashedPassword },
  });
};

/**
 * Updates the profile associated with the logged-in user based on their role.
 */
export const updateUserProfile = async (user, updateData) => {
  const { id: userId, role } = user;
  // Ensure user ID is properly formatted (pad if necessary)
  const formattedUserId = userId.padEnd(25, '0').substring(0, 25);
  
  switch (role) {
    case 'MEMBER':
      return await prisma.memberProfile.update({ where: { userId: formattedUserId }, data: updateData });
    case 'TRAINER':
      return await prisma.trainerProfile.update({ where: { userId: formattedUserId }, data: updateData });
    case 'GYM_OWNER':
      const gym = await prisma.gym.findFirst({ where: { managerId: formattedUserId } });
      if (!gym) throw new AppError('No managed gym found for this user.', 404);
      return await prisma.gym.update({ where: { id: gym.id }, data: updateData });
    default:
      throw new AppError('No updatable profile for this user role.', 400);
  }
};

/**
 * @description Fetches the full user object, including their role-specific profile,
 * active subscriptions, and available multi-gym tiers for purchase.
 */
// In your services/userService.js

export const getUserProfile = async (userId) => {
  // Ensure user ID is properly formatted (pad if necessary)
  const formattedUserId = userId.padEnd(25, '0').substring(0, 25);
  
  console.log(`[UserService] Attempting to fetch full profile for User ID: ${formattedUserId}`);
  if (!formattedUserId) throw new AppError("User not identified.", 401);
  try {
    // Use a transaction to fetch user data and available tiers in parallel
    const [user, availableTiers] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: formattedUserId },
        include: {
            memberProfile: true,
            trainerProfile: {
              include: {
                plans: true // Include trainer plans
              }
            },
            managedGyms: { take: 1 },
            merchantProfile: true,
            subscriptions: {
              where: { status: 'active' },
              include: {
                gymPlan: { select: { id: true, name: true, gym: { select: { id: true, name: true } } } },
                trainerPlan: { select: { id: true, name: true } },
                multiGymTier: true
              }
            },
        },
      }),
      // Fetch all available multi-gym tiers that can be purchased
      prisma.multiGymTier.findMany({
        where: { chargebeePlanId: { not: null } }, // Only show tiers that are actually set up for payment
        orderBy: { price: 'asc' }
      })
    ]);

    if (!user) {
      throw new AppError("User not found.", 404);
    }
    
    // Log the user object to debug
    console.log('User object from database:', user);
    
    // Process subscriptions to handle multi-gym tier
    const processedSubscriptions = user.subscriptions.map(sub => {
      const processedSub = { ...sub };
      
      // Handle multi-gym tier if it exists
      if (sub.multiGymTierId) {
        // Get the tier details from the predefined tiers
        const tiers = getMultiGymTiers();
        const tier = tiers.find(t => t.id === sub.multiGymTierId);
        processedSub.multiGymTier = tier || null;
      }
      
      return processedSub;
    });
    
    // Fetch ALL gyms that accept multi-gym access
    console.log(`[UserService] Fetching all gyms that accept multi-gym access`);
    
    const allMultiGymGyms = await prisma.gym.findMany({
      where: {
        acceptsMultigym: true, // Only get gyms that accept multi-gym
      },
      select: {
        id: true,
        name: true,
        address: true,
        photos: true,
        badges: true,
        status: true,
        latitude: true,
        longitude: true
      }
    });
    
    console.log(`[UserService] Found ${allMultiGymGyms.length} gyms that accept multi-gym access`);
    console.log(`[UserService] Multi-gym gyms:`, allMultiGymGyms.map(g => ({ 
      id: g.id, 
      name: g.name, 
      acceptsMultigym: g.acceptsMultigym,
      status: g.status 
    })));
    
    console.log(`[UserService] Successfully fetched full profile for User ID: ${formattedUserId}`);
    
    // Exclude password before sending back to client
    const { password, ...userResponse } = user;

    // Add the available tiers and accessible gyms to the response object
    const profileWithTiers = {
        ...userResponse,
        subscriptions: processedSubscriptions,
        accessibleGyms: allMultiGymGyms, // All gyms that accept multi-gym
        availableMultiGymTiers: availableTiers
    };

    return profileWithTiers;

  } catch (error) {
    console.error(`[UserService] FATAL ERROR during profile fetch:`, error);
    throw new AppError('Failed to retrieve user profile due to a server error.', 500);
  }
};
/**
 * @description Fetches all of the user's check-ins (active and completed), including gym details.
 */
export const getUserCheckIns = async (userId) => {
  // Ensure user ID is properly formatted (pad if necessary)
  const formattedUserId = userId.padEnd(25, '0').substring(0, 25);
  
  try {
    console.log(`[UserService] Fetching ALL check-ins for user ${formattedUserId}`);
    
    // ✅ CHANGE: Removed the date filter to fetch all check-ins
    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId: formattedUserId, // Only filter by user ID
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        checkIn: 'desc' // Order by most recent check-in first
      }
    });

    // ✅ IMPORTANT: Ensure dates are properly serialized as ISO strings
    const serializedCheckIns = checkIns.map(checkIn => ({
      ...checkIn,
      checkIn: checkIn.checkIn.toISOString(),
      checkOut: checkIn.checkOut ? checkIn.checkOut.toISOString() : null
    }));

    console.log(`[UserService] Found a total of ${serializedCheckIns.length} check-ins for user ${formattedUserId}.`);
    serializedCheckIns.forEach(checkIn => {
        console.log(`[UserService] - CheckIn ID: ${checkIn.id}, Gym: ${checkIn.gym.name}, CheckIn: ${checkIn.checkIn}, CheckOut: ${checkIn.checkOut || 'Still active'}`);
    });

    return serializedCheckIns;
  } catch (error) {
    console.error(`[UserService] Error fetching user check-ins:`, error);
    throw new AppError('Failed to retrieve check-ins due to a server error.', 500);
  }
};

/**
 * @description Placeholder for fetching user statistics.
 */
export const getUserStats = async (userId) => {
  // Ensure user ID is properly formatted (pad if necessary)
  const formattedUserId = userId.padEnd(25, '0').substring(0, 25);
  
    try {
        const totalCheckIns = await prisma.checkIn.count({ where: { userId: formattedUserId } });
        const favoriteGym = await prisma.gym.findFirst({
            where: { checkIns: { some: { userId: formattedUserId } } },
            orderBy: { checkIns: { _count: 'desc' } },
            select: { id: true, name: true }
        });
        const monthlyWorkouts = await prisma.checkIn.count({
            where: {
                userId: formattedUserId,
                checkIn: {
                    gte: new Date(new Date().setDate(1)) // First day of the current month
                }
            }
        });

        return { totalCheckIns, favoriteGym, monthlyWorkouts };
    } catch (error) {
        console.error(`[UserService] Error fetching user stats:`, error);
        throw new AppError('Failed to retrieve user statistics due to a server error.', 500);
    } 
};

/**
 * @description Helper function to get predefined multi-gym tiers
 */
const getMultiGymTiers = () => {
    // Return predefined tiers
    return [
        {
            id: 'silver',
            name: 'Silver',
            price: 49.99,
            chargebeePlanId: process.env.CHARGEBEE_SILVER_PLAN_ID,
            description: 'Access to all Silver tier gyms',
            features: [
                'Access to all Silver tier gyms',
                'Basic amenities access',
                'Monthly fitness assessment'
            ]
        },
        {
            id: 'gold',
            name: 'Gold',
            price: 79.99,
            chargebeePlanId: process.env.CHARGEBEE_GOLD_PLAN_ID,
            description: 'Access to all Gold tier gyms',
            features: [
                'Access to all Gold tier gyms',
                'Premium amenities access',
                'Weekly fitness assessment',
                '1 personal training session per month'
            ]
        },
        {
            id: 'platinum',
            name: 'Platinum',
            price: 119.99,
            chargebeePlanId: process.env.CHARGEBEE_PLATINUM_PLAN_ID,
            description: 'Access to all Platinum tier gyms',
            features: [
                'Access to ALL gyms (200+)',
                'VIP amenities access',
                'Weekly fitness assessment',
                '2 personal training sessions/month',
                'Nutrition consultation'
            ]
        }
    ];
};

/**
 * @description Get user's subscriptions
 */
export const getUserSubscriptions = async (userId) => {
  // Ensure user ID is properly formatted (pad if necessary)
  const formattedUserId = userId.padEnd(25, '0').substring(0, 25);
  
    try {
        const user = await prisma.user.findUnique({
            where: { id: formattedUserId },
            include: {
                memberProfile: true,
                subscriptions: {
                    include: {
                        gymPlan: {
                            include: {
                                gym: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        },
                        trainerPlan: {
                            include: {
                                trainer: {
                                    include: {
                                        user: {
                                            select: {
                                                memberProfile: {
                                                    select: {
                                                        name: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        multiGymTier: true
                    }
                }
            }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user.subscriptions;
    } catch (error) {
        console.error("Error fetching user subscriptions:", error);
        throw error;
    }
};