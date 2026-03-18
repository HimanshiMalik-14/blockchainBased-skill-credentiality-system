import mongoose from "mongoose";

const { Schema } = mongoose;

const certificateSchema = new Schema(
  {
    certificateId: { type: String, required: true, unique: true, index: true },

    learnerId: { type: String, required: true, index: true },
    institutionId: { type: String, required: true, index: true },

    courseName: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true },

    templateId: { type: String },
    templateVersion: { type: String },

    metadataUri: { type: String },
    pdfUri: { type: String },

    certificateHash: { type: String, required: true, unique: true, index: true },

    status: {
      type: String,
      required: true,
      enum: ["DRAFT", "PENDING_CHAIN", "ISSUED", "REVOKED"],
      default: "PENDING_CHAIN",
      index: true
    },

    blockchain: {
      network: { type: String, enum: ["polygon", "ethereum"], index: true },
      chainId: { type: Number },
      contractAddress: { type: String, lowercase: true, trim: true },
      txHash: { type: String, index: true },
      blockNumber: { type: Number },
      issuedAt: { type: Date }
    },

    revocation: {
      revokedAt: { type: Date },
      revokedBy: { type: String },
      reason: { type: String },
      revokeTxHash: { type: String }
    }
  },
  { timestamps: true }
);

certificateSchema.index({ learnerId: 1, issueDate: -1 });

export const Certificate = mongoose.model("Certificate", certificateSchema);

