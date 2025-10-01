import * as transactionService from '../services/transactionService.js';

import catchAsync from '../utils/catchAsync.js';

/**
 * @description Controller to get the logged-in user's transaction history.
 */
export const getMyTransactions = catchAsync(async (req, res, next) => {
  // The service handles all the logic of fetching and paginating
  const result = await transactionService.getUserTransactions(req.user.id, req.query);
  
  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

