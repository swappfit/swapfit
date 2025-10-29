import express from 'express';
import * as cartController from '../controllers/cartController.js';
import authGatekeeper from '../middlewares/authGatekeeper.js';
import validate, {
    addToCartSchema,
    updateCartItemSchema,
    cartItemIdParamSchema
} from '../validators/cartValidator.js';

const router = express.Router();

// All these routes are now using the same middleware as userRoutes
router.get('/', authGatekeeper, cartController.getMyCart);
router.post('/', authGatekeeper, validate(addToCartSchema), cartController.addToCart);
router.patch('/:cartItemId', authGatekeeper, validate(updateCartItemSchema), cartController.updateCartItem);
router.delete('/:cartItemId', authGatekeeper, validate(cartItemIdParamSchema), cartController.removeFromCart);
router.post('/checkout', authGatekeeper, cartController.createCheckout);

export default router;