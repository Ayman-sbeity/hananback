import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    email: { 
      type: String, 
      required: true,
      trim: true,
      lowercase: true
    },
    phoneNumber: { 
      type: String, 
      required: false,
      trim: true
    },
    message: { 
      type: String, 
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["new", "read", "responded"],
      default: "new"
    },
    response: {
      type: String,
      default: ""
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);
