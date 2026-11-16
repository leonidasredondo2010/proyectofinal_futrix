import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100, trim: true },
    phone: { type: String, required: true, maxlength: 20, trim: true },
    email: { type: String, required: true, maxlength: 254, lowercase: true, trim: true },
    size: { type: String, required: true, enum: ["5", "6", "7", "8"] },
    message: { type: String, required: true, maxlength: 2000, trim: true },
  },
  { timestamps: true, versionKey: false },
);

export const Contact = mongoose.model("Contact", contactSchema);
