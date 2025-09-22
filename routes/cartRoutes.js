import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../controllers/cartController.js';

const router = express.Router();

router.get('/', getCart); 
router.get('/user/:userId', protect, getCart); 
router.post('/add', protect, addToCart); 
router.put('/update', protect, updateCartItem); 
router.delete('/item/:productId', protect, removeCartItem); 
router.delete('/clear', protect, clearCart); 

export default router;
