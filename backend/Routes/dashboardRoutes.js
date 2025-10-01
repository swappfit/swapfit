// Routes/dashboardRoutes.js
import express from 'express';
import jwtAuth from '../middlewares/jwtAuth.js';

// Import all necessary dashboard controllers
import * as memberDashboardController from '../controllers/dashboardController.js';
import * as adminDashboardController from '../controllers/adminController.js';
import * as gymDashboardController from '../controllers/gymController.js';
import * as trainerDashboardController from '../controllers/trainerController.js';
import * as merchantDashboardController from '../controllers/merchantController.js';

const router = express.Router();

router.use(jwtAuth);

router.get('/', (req, res, next) => {
    const { role, isAdmin } = req.user;

    if (isAdmin) {
        return adminDashboardController.getAdminDashboard(req, res, next);
    }

    switch (role) {
        case 'MEMBER':
            return memberDashboardController.getMemberDashboard(req, res, next);
        case 'GYM_OWNER':
            return gymDashboardController.getOwnerDashboard(req, res, next);
        case 'TRAINER':
            return trainerDashboardController.getTrainerDashboard(req, res, next);
        // ✅ ADD THE MERCHANT CASE
        case 'MERCHANT':
            return merchantDashboardController.getMerchantDashboard(req, res, next);
        default:
            res.status(404).json({ success: false, message: 'No dashboard available for this user role.' });
    }
});

export default router;