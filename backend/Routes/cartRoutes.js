import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { auth0Middleware } from '../middlewares/auth0Middleware.js'; // Ensure path is correct
import validate, {
    addToCartSchema,
    updateCartItemSchema,
    cartItemIdParamSchema
} from '../validators/cartValidator.js';

const router = express.Router();

// All these routes are correctly protected by the auth middleware
router.get('/', auth0Middleware, cartController.getMyCart);
router.post('/', auth0Middleware, validate(addToCartSchema), cartController.addToCart);
router.patch('/:cartItemId', auth0Middleware, validate(updateCartItemSchema), cartController.updateCartItem);
router.delete('/:cartItemId', auth0Middleware, validate(cartItemIdParamSchema), cartController.removeFromCart);
router.post('/checkout', auth0Middleware, cartController.createCheckout);

export default router;