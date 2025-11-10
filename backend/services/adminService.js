import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

export const getPendingGyms = async () => {
    return await prisma.gym.findMany({
        where: { status: 'pending' },
        include: { manager: { select: { email: true } } }
    });
};

export const updateGymStatus = async (gymId, status) => {
    if (!['approved', 'rejected'].includes(status)) {
        throw new AppError('Invalid status provided. Must be "approved" or "rejected".', 400);
    }
    const gym = await prisma.gym.findUnique({ where: { id: gymId }});
    if (!gym) throw new AppError('Gym not found.', 404);

    return await prisma.gym.update({
        where: { id: gymId },
        data: { status },
    });
};

export const updateGymBadges = async (gymId, badges) => {
    if (!Array.isArray(badges)) {
        throw new AppError('Badges must be provided as an array of strings.', 400);
    }
    const gym = await prisma.gym.findUnique({ where: { id: gymId }});
    if (!gym) throw new AppError('Gym not found.', 404);
    if (gym.status !== 'approved') {
        throw new AppError('Badges can only be added to approved gyms.', 400);
    }

    return await prisma.gym.update({
        where: { id: gymId },
        data: { badges: badges },
    });
};

export const getAdminDashboardStats = async () => {
  const [
    totalUsers,
    totalTrainers,
    totalGyms,
    pendingGyms,
    activeSubscriptions,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.trainerProfile.count(),
    prisma.gym.count(),
    prisma.gym.count({ where: { status: 'pending' } }),
    prisma.subscription.count({ where: { status: { in: ['active', 'in_trial'] } } }),
  ]);

  const stats = {
    userStats: {
      total: totalUsers,
      trainers: totalTrainers,
      gymOwners: await prisma.user.count({ where: { role: 'GYM_OWNER' } }),
      members: await prisma.user.count({ where: { role: 'MEMBER' } }),
    },
    gymStats: {
      total: totalGyms,
      pendingApproval: pendingGyms,
      approved: await prisma.gym.count({ where: { status: 'approved' } }),
    },
    platformStats: {
      activeSubscriptions: activeSubscriptions,
      totalRevenue: 0, 
    },
  };

  return stats;
};

export const getUsers = async ({ page = 1, limit = 20, role, status, search }) => {
  const skip = (page - 1) * limit;
  
  // Build the where clause
  let where = {};
  
  if (role) {
    where.role = role;
  }
  
  if (status) {
    // Convert status to lowercase for comparison
    where.status = status.toLowerCase();
  }
  
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { memberProfile: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      // Fixed: Use 'id' instead of 'createdAt' for ordering
      orderBy: { id: 'desc' },
      include: {
        memberProfile: true,
        trainerProfile: true,
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
                  select: {
                    id: true,
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
            }
          }
        },
        _count: {
          select: {
            subscriptions: true
          }
        }
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Transform the data to match frontend expectations
  const transformedUsers = users.map(user => {
    // Generate avatar from email or name
    const email = user.email || '';
    const name = user.memberProfile?.name || '';
    const avatar = (name || email).substring(0, 2).toUpperCase();
    
    // Determine tier from badges or subscription
    let tier = 'Basic';
    if (user.subscriptions.length > 0) {
      // Check if user has any active subscriptions
      const activeSubscriptions = user.subscriptions.filter(sub => 
        sub.status === 'active' || sub.status === 'in_trial'
      );
      
      if (activeSubscriptions.length > 0) {
        // For simplicity, set tier based on the number of active subscriptions
        if (activeSubscriptions.length >= 3) tier = 'Platinum';
        else if (activeSubscriptions.length >= 2) tier = 'Gold';
        else if (activeSubscriptions.length >= 1) tier = 'Premium';
      }
    }
    
    // Extract gym names from subscriptions
    const gymNames = user.subscriptions
      .filter(sub => sub.gymPlan && sub.gymPlan.gym)
      .map(sub => sub.gymPlan.gym.name);
    
    // Extract trainer names from subscriptions
    const trainerNames = user.subscriptions
      .filter(sub => sub.trainerPlan && sub.trainerPlan.user && sub.trainerPlan.user.memberProfile)
      .map(sub => sub.trainerPlan.user.memberProfile.name);
    
    return {
      id: user.id,
      name: user.memberProfile?.name || email.split('@')[0] || 'Unknown',
      email: user.email,
      phone: user.memberProfile?.phone || '',
      role: user.role,
      status: user.status || 'Active', // Default to Active if not set
      tier: tier,
      avatar: avatar,
      subscriptionCount: user._count.subscriptions,
      gymNames: gymNames, // Add gym names
      trainerNames: trainerNames, // Add trainer names
      // Fixed: Use a placeholder date if createdAt doesn't exist
      createdAt: user.createdAt || new Date().toISOString()
    };
  });

  return { 
    users: transformedUsers, 
    total, 
    page, 
    limit, 
    totalPages: Math.ceil(total / limit) 
  };
};
export const getUserStats = async () => {
  const [
    total,
    active,
    newThisMonth,
    withActiveSubscriptions
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'active' } }),
    prisma.user.count({ 
      where: { 
        // Fixed: Use a different approach if createdAt doesn't exist
        // This is a placeholder - adjust based on your actual schema
        id: {
          gte: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60 // Last 30 days
        }
      } 
    }),
    prisma.user.count({
      where: {
        subscriptions: {
          some: {
            status: { in: ['active', 'in_trial'] }
          }
        }
      }
    })
  ]);

  return {
    total,
    active,
    newThisMonth,
    withActiveSubscriptions
  };
};

export const getSchedules = async () => {
  const schedules = await prisma.schedule.findMany({
    orderBy: { id: 'desc' }, // Fixed: Use 'id' instead of 'createdAt'
    take: 200,
    include: { gym: { select: { id: true, name: true } } },
  });
  return schedules;
};

export const sendBroadcastNotification = async (notificationData) => {
  const allUsers = await prisma.user.findMany({
    select: { id: true },
  });

  if (allUsers.length === 0) {
    throw new AppError('No users found on the platform to notify.', 404);
  }

  const allUserIds = allUsers.map(user => user.id);

  const notificationsToCreate = allUserIds.map(userId => ({
    recipientId: userId,
    title: notificationData.title,
    message: notificationData.message,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.notification.createMany({
      data: notificationsToCreate,
    });

    // TODO: Send push notifications when Firebase is properly configured
    console.log('Broadcast notification created for', allUserIds.length, 'users');
  });

  return allUserIds.length;
};

export const getMultiGymTiers = async () => {
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
                'Access to all Platinum tier gyms',
                'VIP amenities access',
                'Weekly fitness assessment',
                '2 personal training sessions per month',
                'Nutrition consultation'
            ]
        }
    ];
};

export const assignGymToTier = async (gymId, tierName) => {
    const validTiers = ['Silver', 'Gold', 'Platinum'];
    if (!validTiers.includes(tierName)) {
        throw new AppError('Invalid tier name. Must be Silver, Gold, or Platinum.', 400);
    }
    
    const gym = await prisma.gym.findUnique({ where: { id: gymId }});
    if (!gym) throw new AppError('Gym not found.', 404);
    if (gym.status !== 'approved') {
        throw new AppError('Tiers can only be assigned to approved gyms.', 400);
    }

    return await prisma.gym.update({
        where: { id: gymId },
        data: { badges: [tierName] },
    });
};

// Get users with their subscriptions
export const getUsersWithSubscriptions = async () => {
  const users = await prisma.user.findMany({
    include: {
      memberProfile: true,
      trainerProfile: true,
      subscriptions: {
        include: {
          gymPlan: {
            select: {
              id: true,
              name: true,
              price: true,
              gym: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          trainerPlan: {
            select: {
              id: true,
              name: true,
              price: true,
              trainer: {
                select: {
                  id: true,
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
          }
        }
      }
    },
    orderBy: {
      id: 'desc' // Fixed: Use 'id' instead of 'createdAt'
    }
  });

  return users;
};

// Get all transactions
export const getAllTransactions = async () => {
  const transactions = await prisma.transaction.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          memberProfile: {
            select: {
              name: true
            }
          }
        }
      },
      subscription: {
        select: {
          id: true,
          status: true,
          gymPlan: {
            select: {
              name: true
            }
          },
          trainerPlan: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      id: 'desc' // Fixed: Use 'id' instead of 'createdAt'
    }
  });

  return transactions;
};

// Get all plans (gym and trainer)
export const getAllPlans = async () => {
  const gymPlans = await prisma.gymPlan.findMany({
    include: {
      gym: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          subscriptions: true
        }
      }
    }
  });

  const trainerPlans = await prisma.trainerPlan.findMany({
    include: {
      trainer: {
        select: {
          id: true,
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
      },
      _count: {
        select: {
          subscriptions: true
        }
      }
    }
  });

  return [...gymPlans, ...trainerPlans];
};

// Get all gyms
export const getAllGyms = async () => {
  const gyms = await prisma.gym.findMany({
    include: {
      manager: {
        select: {
          id: true,
          email: true,
          memberProfile: {
            select: {
              name: true
            }
          }
        }
      },
      plans: {
        include: {
          _count: {
            select: {
              subscriptions: true
            }
          }
        }
      },
      _count: {
        select: {
          subscriptions: true
        }
      }
    },
    orderBy: {
      id: 'desc' // Fixed: Use 'id' instead of 'createdAt'
    }
  });

  return gyms;
};

// Get subscription by ID
export const getSubscriptionById = async (subscriptionId) => {
  const subscription = await prisma.subscription.findUnique({
    where: {
      id: subscriptionId
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          memberProfile: {
            select: {
              name: true
            }
          }
        }
      },
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
            select: {
              id: true,
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
      }
    }
  });

  if (!subscription) {
    throw new AppError('Subscription not found', 404);
  }

  return subscription;
};

// Cancel user subscription
export const cancelUserSubscription = async (subscriptionId) => {
  const subscription = await prisma.subscription.findUnique({
    where: {
      id: subscriptionId
    }
  });

  if (!subscription) {
    throw new AppError('Subscription not found', 404);
  }

  const updatedSubscription = await prisma.subscription.update({
    where: {
      id: subscriptionId
    },
    data: {
      status: 'cancelled',
      cancelledAt: new Date()
    }
  });

  return updatedSubscription;
};

// Get subscription statistics
export const getSubscriptionStats = async () => {
  const [
    totalSubscriptions,
    activeSubscriptions,
    cancelledSubscriptions,
    gymSubscriptions,
    trainerSubscriptions,
    multiGymSubscriptions,
    revenue
  ] = await prisma.$transaction([
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.count({ where: { status: 'cancelled' } }),
    prisma.subscription.count({ where: { gymPlanId: { not: null } } }),
    prisma.subscription.count({ where: { trainerPlanId: { not: null } } }),
    prisma.subscription.count({ where: { multiGymTierId: { not: null } } }),
    prisma.transaction.aggregate({
      _sum: {
        amount: true
      }
    })
  ]);

  return {
    total: totalSubscriptions,
    active: activeSubscriptions,
    cancelled: cancelledSubscriptions,
    byType: {
      gym: gymSubscriptions,
      trainer: trainerSubscriptions,
      multiGym: multiGymSubscriptions
    },
    revenue: revenue._sum.amount || 0
  };
};

// Get all subscriptions (not just multi-gym)
export const getAllSubscriptions = async () => {
  try {
    const users = await prisma.user.findMany({
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
      },
      orderBy: {
        id: 'desc' // Fixed: Use 'id' instead of 'createdAt'
      }
    });

    // Process the data to extract all subscriptions
    const allSubscriptions = [];
    
    users.forEach(user => {
      if (user.subscriptions && user.subscriptions.length > 0) {
        user.subscriptions.forEach(subscription => {
          allSubscriptions.push({
            ...subscription,
            userId: user.id,
            userEmail: user.email,
            userName: user.memberProfile?.name || user.email?.split('@')[0] || 'Unknown',
            userAvatar: (user.email || 'U')[0] + (user.email?.split('@')[0]?.[1] || 'N'),
          });
        });
      }
    });
    
    return allSubscriptions;
  } catch (error) {
    console.error("Error fetching all subscriptions:", error);
    throw error;
  }
}

// Get multi-gym subscriptions (public endpoint)
export const getMultiGymSubscriptions = async () => {
  try {
    const users = await prisma.user.findMany({
      include: {
        memberProfile: true,
        subscriptions: {
          where: {
            multiGymTierId: { not: null }
          },
          include: {
            multiGymTier: true
          }
        }
      },
      orderBy: {
        id: 'desc' // Fixed: Use 'id' instead of 'createdAt'
      }
    });

    // Process the data to extract only multi-gym subscriptions
    const allSubscriptions = [];
    
    users.forEach(user => {
      if (user.subscriptions && user.subscriptions.length > 0) {
        user.subscriptions.forEach(subscription => {
          allSubscriptions.push({
            ...subscription,
            userId: user.id,
            userEmail: user.email,
            userName: user.memberProfile?.name || user.email?.split('@')[0] || 'Unknown',
            userAvatar: (user.email || 'U')[0] + (user.email?.split('@')[0]?.[1] || 'N'),
          });
        });
      }
    });
    
    return allSubscriptions;
  } catch (error) {
    console.error("Error fetching multi-gym subscriptions:", error);
    throw error;
  }
}