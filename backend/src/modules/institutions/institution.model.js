import mongoose from "mongoose";

const { Schema } = mongoose;

const institutionSchema = new Schema(
  {
    institutionId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    location: { type: String, trim: true },

    accreditationStatus: {
      type: String,
      required: true,
      enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "PENDING",
      index: true
    },

    adminContact: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true }
    },

    issuerWalletAddress: { type: String, trim: true, lowercase: true }
  },
  { timestamps: true }
);

export const Institution = mongoose.model("Institution", institutionSchema);

