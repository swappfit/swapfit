import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @description Retrieves a paginated history of transactions for a specific user.
 * @param {string} userId - The ID of the user.
 * @param {object} pagination - Pagination options ({ page, limit }).
 * @returns {Promise<object>} An object containing the transaction data and pagination details.
 */
export const getUserTransactions = async (userId, { page, limit }) => {
  const skip = (page - 1) * limit;

  // Use a transaction to get both the data and the total count in one DB call
  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return {
    data: transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

