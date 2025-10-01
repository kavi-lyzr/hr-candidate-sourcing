import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IToolVersion {
  toolName: string; // e.g., 'hr_sourcing_api'
  version: string;
  lyzrToolId: string[]; // The ID returned by Lyzr API for the created toolset
  openapi_schema: object;
}

export interface IToolVersionDocument extends IToolVersion, Document {
  _id: Types.ObjectId;
}

const ToolVersionSchema: Schema<IToolVersionDocument> = new Schema<IToolVersionDocument>(
  {
    toolName: { type: String, required: true },
    version: { type: String, required: true },
    lyzrToolId: [{ type: String, required: true }],
    openapi_schema: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

ToolVersionSchema.index({ toolName: 1, version: 1 }, { unique: true });

if (mongoose.models.ToolVersion) {
  delete mongoose.models.ToolVersion;
}

export default mongoose.model<IToolVersionDocument>('ToolVersion', ToolVersionSchema);
