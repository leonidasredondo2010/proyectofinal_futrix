import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 100, trim: true },
    email: { type: String, required: true, maxlength: 254, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true, versionKey: false },
);

export const User = mongoose.model("User", userSchema);
