import Order from '../models/Order.js';
import Cart from '../models/Cart.js';

export const createOrder = async (req, res) => {
  try {
    const { 
      address, 
      paymentMethod 
    } = req.body;

    const userId = req.user ? req.user._id : null;
    const guestId = req.cookies.guestId || null;

    const cart = userId 
      ? await Cart.findOne({ user: userId }).populate('items.product')
      : await Cart.findOne({ guestId }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image
    }));

    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 0; 
    const total = subtotal + shipping;

    const order = new Order({
      user: userId,
      items: orderItems,
      address,
      subtotal,
      shipping,
      total,
      paymentMethod,

      isPaid: false
    });
    
    const savedOrder = await order.save();

    await Cart.findByIdAndDelete(cart._id);
    
    res.status(201).json({ 
      message: 'Order created successfully', 
      order: savedOrder 
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create order', 
      error: error.message 
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
      
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch orders', 
      error: error.message 
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 });
      
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch orders', 
      error: error.message 
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product');
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!req.user.isAdmin && order.user && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this order' });
    }
    
    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch order', 
      error: error.message 
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.status = status;
    order.updatedAt = Date.now();

    if (status === 'processing' && !order.isPaid && order.paymentMethod !== 'cash') {
      
      order.isPaid = true;
      order.paidAt = Date.now();
    } else if (status === 'delivered' && !order.isPaid && order.paymentMethod === 'cash') {
      
      order.isPaid = true;
      order.paidAt = Date.now();
    }
    
    const updatedOrder = await order.save();
    
    res.status(200).json({ 
      message: 'Order updated successfully', 
      order: updatedOrder 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update order', 
      error: error.message 
    });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    await Order.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete order', 
      error: error.message 
    });
  }
};
