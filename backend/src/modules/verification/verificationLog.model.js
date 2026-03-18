import mongoose from "mongoose";

const { Schema } = mongoose;

const verificationLogSchema = new Schema(
  {
    verificationId: { type: String, required: true, unique: true, index: true },
    certificateId: { type: String, required: true, index: true },

    verifierId: { type: String, index: true },
    method: { type: String, required: true, enum: ["QR", "ID", "API"], default: "ID" },

    timestamp: { type: Date, required: true, index: true },
    result: { type: String, required: true, enum: ["VALID", "INVALID", "REVOKED", "NOT_FOUND"] },

    details: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

verificationLogSchema.index({ certificateId: 1, timestamp: -1 });

export const VerificationLog = mongoose.model("VerificationLog", verificationLogSchema);

