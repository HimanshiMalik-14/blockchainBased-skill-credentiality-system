import mongoose from "mongoose";

const { Schema } = mongoose;

export const USER_ROLES = ["LEARNER", "INSTITUTION", "EMPLOYER", "ADMIN"];

const userSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    role: { type: String, required: true, enum: USER_ROLES, index: true },

    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true, index: true },

    passwordHash: { type: String },

    institutionId: { type: String, index: true },
    walletAddress: { type: String, trim: true, lowercase: true },

    status: { type: String, required: true, enum: ["PENDING", "ACTIVE", "SUSPENDED"], default: "ACTIVE" },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string" } }
  }
);

userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: "string" } }
  }
);

export const User = mongoose.model("User", userSchema);

