// File: controllers/razorpayController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
import Razorpay from 'razorpay.js';

// Initialize Razorpay with your Key ID and Key Secret
// IMPORTANT: Store these in your .env file, NOT hardcoded.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const razorpayController = {
  /**
   * @description Onboards a trainer as a Razorpay Linked Account.
   */
  onboardTrainerAsLinkedAccount: async (req, res) => {
    const userId = req.user.id;
    // These details would be collected from a form in the trainer's settings
    const { name, email, contact, business_type } = req.body;

    try {
      const trainerProfile = await prisma.trainerProfile.findUnique({ where: { userId } });
      if (!trainerProfile) {
        return res.status(404).json({ success: false, message: 'Trainer profile not found.' });
      }

      const account = await razorpay.accounts.create({
        type: 'route',
        email,
        contact_info: {
          email,
          contact
        },
        profile_data: {
          name,
          business_type // "individual", "partnership", etc.
        }
      });
      
      // Save the new Razorpay Account ID to the trainer's profile
      await prisma.trainerProfile.update({
        where: { id: trainerProfile.id },
        data: { razorpayAccountId: account.id }
      });

      res.status(201).json({ success: true, message: 'Trainer onboarded successfully.', data: account });
    } catch (err) {
      console.error('Razorpay onboarding error:', err);
      res.status(500).json({ success: false, message: 'Failed to onboard trainer.', error: err.message });
    }
  },

  // You would create a similar function 'onboardGymAsLinkedAccount' for Gym Owners

  /**
   * @description Initiates a payout for a provider from their Linked Account.
   */
  createPayout: async (req, res) => {
    const userId = req.user.id;
    const { amount, currency, mode, purpose, bank_account } = req.body;
    
    try {
        const trainerProfile = await prisma.trainerProfile.findUnique({ where: { userId } });
        if (!trainerProfile || !trainerProfile.razorpayAccountId) {
            return res.status(403).json({ success: false, message: 'Provider account not found or not onboarded.' });
        }

        const payout = await razorpay.payouts.create({
            account_number: trainerProfile.razorpayAccountId,
            amount: amount * 100, // Amount in paise
            currency,
            mode, // "IMPS", "NEFT", "RTGS"
            purpose, // "payout", "refund"
            fund_account: {
                account_type: 'bank_account',
                bank_account: {
                    name: bank_account.name,
                    ifsc: bank_account.ifsc,
                    account_number: bank_account.account_number
                }
            }
        });
        
        res.status(201).json({ success: true, message: 'Payout initiated.', data: payout });
    } catch(err) {
        console.error('Razorpay payout error:', err);
        res.status(500).json({ success: false, message: 'Failed to initiate payout.', error: err.message });
    }
  },
};

export default razorpayController;

