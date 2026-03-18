import mongoose from "mongoose";

const { Schema } = mongoose;

const blockchainTransactionSchema = new Schema(
  {
    txHash: { type: String, required: true, unique: true, index: true },
    certificateId: { type: String, required: true, index: true },

    network: { type: String, enum: ["polygon", "ethereum"], index: true },
    chainId: { type: Number },
    from: { type: String, lowercase: true, trim: true },
    to: { type: String, lowercase: true, trim: true },
    contractAddress: { type: String, lowercase: true, trim: true },

    status: { type: String, required: true, enum: ["SUBMITTED", "CONFIRMED", "FAILED"], index: true },
    blockNumber: { type: Number },
    timestamp: { type: Date },
    gasUsed: { type: String },
    error: { type: String }
  },
  { timestamps: true }
);

export const BlockchainTransaction = mongoose.model("BlockchainTransaction", blockchainTransactionSchema);

