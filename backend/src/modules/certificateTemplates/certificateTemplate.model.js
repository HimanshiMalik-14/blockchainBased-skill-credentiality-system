import mongoose from "mongoose";

const { Schema } = mongoose;

const certificateTemplateSchema = new Schema(
  {
    templateId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    version: { type: String, default: "1.0" },
    fieldsSchema: { type: Schema.Types.Mixed },
    approvedByAdmin: { type: Boolean, default: false },
    status: { type: String, enum: ["DRAFT", "APPROVED"], default: "DRAFT", index: true }
  },
  { timestamps: true }
);

export const CertificateTemplate = mongoose.model("CertificateTemplate", certificateTemplateSchema);
