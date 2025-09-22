import express from 'express';
import { 
  createOrder, 
  getAllOrders, 
  getUserOrders, 
  getOrderById, 
  updateOrderStatus, 
  deleteOrder 
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import Order from '../models/Order.js';

const router = express.Router();

router.post('/', protect, createOrder);

router.get('/count', protect, admin, async (req, res) => {
  try {
    const count = await Order.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', protect, admin, getAllOrders);

router.get('/myorders', protect, getUserOrders);

router.get('/:id', protect, getOrderById);

router.put('/:id/status', protect, admin, updateOrderStatus);

router.delete('/:id', protect, admin, deleteOrder);

export default router;
