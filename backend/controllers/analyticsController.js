// File: controllers/analyticsController.js

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const analyticsController = {
  /**
   * @description Gathers and aggregates key analytics for a specific gym owned by the user.
   */
  getGymAnalytics: async (req, res) => {
    const ownerId = req.user.id;
    const { gymId } = req.params;

    try {
      // 1. SECURITY: Verify the user owns this gym.
      const gym = await prisma.gym.findUnique({ where: { id: gymId } });
      if (!gym || gym.ownerId !== ownerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not own this gym.' });
      }

      // 2. Perform multiple aggregation queries in a single transaction for efficiency.
      const [
        totalRevenue,
        monthlyRevenue,
        activeMembers,
        memberSignups,
        checkInTrends,
      ] = await prisma.$transaction([
        // Query for Total Revenue (from all active subscriptions)
        prisma.subscription.aggregate({
          _sum: { gymPlan: { select: { price: true } } }, // This structure is conceptual; see note below
          where: { status: 'active', gymPlan: { gymId: gymId } },
        }),
        // NOTE on Revenue: A better way for revenue is to use the `Transaction` model once it's active.
        // For now, we'll simulate from active subscriptions.
        
        // Query for Active Member Count
        prisma.subscription.count({
          where: { status: 'active', gymPlan: { gymId: gymId } },
        }),

        // Query for Member Signups over the last 30 days
        prisma.subscription.count({
            where: {
                gymPlan: { gymId: gymId },
                startDate: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
            }
        }),

        // Query for Check-in trends over the last 7 days (raw data)
        prisma.checkIn.groupBy({
            by: ['checkIn'],
            where: {
                gymId: gymId,
                checkIn: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
            },
            _count: { _all: true }
        }),
      ]);

      // Simple revenue calculation based on active members and their plan price.
      // This is a simulation. A real system would sum up actual `Transaction` records.
      const activeSubsWithPrice = await prisma.subscription.findMany({
          where: { status: 'active', gymPlan: { gymId: gymId } },
          select: { gymPlan: { select: { price: true } } }
      });
      const calculatedRevenue = activeSubsWithPrice.reduce((sum, sub) => sum + (sub.gymPlan?.price || 0), 0);


      // Format the analytics data for a clean response
      const responseData = {
        paymentHistory: {
            totalRevenue: calculatedRevenue,
            monthlyRevenue: calculatedRevenue, // Assuming all plans are monthly for this simulation
            pendingDues: 0, // Placeholder
        },
        memberTrends: {
            activeMembers: activeMembers,
            last30DaysSignups: memberSignups,
        },
        checkInTrends: checkInTrends.map(day => ({
            date: day.checkIn.toISOString().split('T')[0], // Format as YYYY-MM-DD
            count: day._count._all
        }))
      };

      res.json({ success: true, data: responseData });

    } catch (err) {
      console.error(`Get gym analytics error for gym ${gymId}:`, err);
      res.status(500).json({ success: false, message: 'Failed to retrieve gym analytics.' });
    }
  },
};

export default analyticsController;

