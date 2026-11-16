import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: String, required: true, enum: ["5", "6", "7", "8"] },
    reference: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customer: {
      name: { type: String, required: true, maxlength: 100, trim: true },
      phone: { type: String, required: true, maxlength: 20, trim: true },
      email: { type: String, maxlength: 254, lowercase: true, trim: true },
    },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["pending"], default: "pending" },
  },
  { timestamps: true, versionKey: false },
);

export const Order = mongoose.model("Order", orderSchema);
