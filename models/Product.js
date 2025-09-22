import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true }, 
    stock: { type: Number, required: true, default: 0 },
    category: { type: String, required: true },
    brand: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' }); 
productSchema.index({ category: 1 }); 
productSchema.index({ price: 1 }); 
productSchema.index({ isActive: 1 }); 
productSchema.index({ createdAt: -1 }); 
productSchema.index({ category: 1, price: 1 }); 

export default mongoose.model("Product", productSchema);