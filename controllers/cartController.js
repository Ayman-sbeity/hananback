import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { v4 as uuidv4 } from 'uuid';

const getOrCreateGuestId = (req) => {
  if (!req.cookies.guestCartId) {
    return uuidv4();
  }
  return req.cookies.guestCartId;
};

const getCart = async (req, res) => {
  try {
    if (req.params.userId) {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized to access this cart' });
      }
      
      if (req.user._id.toString() !== req.params.userId) {
        return res.status(403).json({ message: 'Not authorized to access this cart' });
      }
      
      const cart = await Cart.findOne({ user: req.params.userId });
      
      if (!cart) {
        return res.status(200).json({ items: [], totalPrice: 0 });
      }
      
      await cart.populate('items.product', 'name price image');
      
      return res.status(200).json(cart);
    }
    
    const userId = req.user ? req.user._id : null;
    const guestId = !userId ? getOrCreateGuestId(req) : req.cookies.guestCartId;
    const cart = await Cart.getCart(userId, guestId);
    
    if (!cart) {
      return res.status(200).json({ items: [], totalPrice: 0 });
    }
    
    await cart.populate('items.product', 'name price image');
    if (!userId && guestId) {
      res.cookie('guestCartId', guestId, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        sameSite: 'strict'
      });
    }
    
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user ? req.user._id : null;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required to add items to cart',
        requiresAuth: true
      });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }
    
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );
    
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        product: productId,
        quantity: Number(quantity),
        price: product.price,
        name: product.name,
        image: product.image
      });
    }
    await cart.save();
    
    await cart.populate('items.product', 'name price image');
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: 'ProductId and quantity are required' });
    }
    
    const userId = req.user ? req.user._id : null;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required to update cart',
        requiresAuth: true
      });
    }
    
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    if (quantity <= 0) {
      
      cart.items.splice(itemIndex, 1);
    } else {
      
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    await cart.populate('items.product', 'name price image');
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Failed to update cart item', error: error.message });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const userId = req.user ? req.user._id : null;

    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required to remove items from cart',
        requiresAuth: true
      });
    }

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);

    await cart.save();

    await cart.populate('items.product', 'name price image');
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ message: 'Failed to remove item from cart', error: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;

    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required to clear cart',
        requiresAuth: true
      });
    }

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    
    await cart.save();
    
    res.status(200).json({ message: 'Cart cleared successfully', cart });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Failed to clear cart', error: error.message });
  }
};

const mergeGuestCart = async (userId, guestId) => {
  try {
    if (!userId || !guestId) return;

    const userCart = await Cart.findOne({ user: userId });
    const guestCart = await Cart.findOne({ guestId });
    
    if (!guestCart) return;
    
    if (!userCart) {
      
      guestCart.user = userId;
      guestCart.guestId = undefined;
      await guestCart.save();
      return;
    }

    guestCart.items.forEach(guestItem => {
      const existingItemIndex = userCart.items.findIndex(item => 
        item.product.toString() === guestItem.product.toString()
      );
      
      if (existingItemIndex > -1) {
        
        userCart.items[existingItemIndex].quantity += guestItem.quantity;
      } else {
        
        userCart.items.push(guestItem);
      }
    });

    await userCart.save();
  
    await Cart.findByIdAndDelete(guestCart._id);
  } catch (error) {
    console.error('Error merging carts:', error);
  }
};

export { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeCartItem, 
  clearCart,
  mergeGuestCart
};
