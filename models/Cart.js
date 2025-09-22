import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: false
  }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false 
  },
  items: [CartItemSchema],
  totalPrice: {
    type: Number,
    default: 0
  },
  guestId: {
    type: String,
    required: false 
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

CartSchema.pre('save', function(next) {
  this.totalPrice = this.items.reduce(
    (total, item) => total + (item.price * item.quantity),
    0
  );
  this.updatedAt = Date.now();
  next();
});

CartSchema.statics.getCart = async function(userId, guestId) {
  if (userId) {
    
    let cart = await this.findOne({ user: userId });

    if (guestId) {
      const guestCart = await this.findOne({ guestId });
      if (guestCart && (!cart || cart.items.length === 0)) {
        
        if (!cart) {
          cart = guestCart;
          cart.user = userId;
          cart.guestId = undefined;
        } else {
          
          cart.items = guestCart.items;
          
          await this.findByIdAndDelete(guestCart._id);
        }
      }
    }

    if (!cart) {
      cart = new this({ user: userId, items: [] });
    }
    
    return cart;
  } else if (guestId) {
    
    let cart = await this.findOne({ guestId });
    if (!cart) {
      cart = new this({ guestId, items: [] });
    }
    return cart;
  }
  
  return null;
};

const Cart = mongoose.model('Cart', CartSchema);

export default Cart;
