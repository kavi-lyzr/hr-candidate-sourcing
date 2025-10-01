import mongoose, { Document, Model, Schema } from 'mongoose';
import { IUser } from './User';

export interface IOrganization extends Document {
  _id: string;
  name: string;
  lyzrApiKey?: string; // Encrypted API key for Lyzr integration
  lyzrAgentId?: string; // Lyzr Agent ID
  lyzrKnowledgeBaseId?: string; // Lyzr Knowledge Base (RAG) ID
  lyzrToolIds?: string[]; // Array of Lyzr Tool IDs from toolset
  avatar?: string;
  createdBy: Schema.Types.ObjectId | IUser;
  systemInstruction?: string;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema<IOrganization> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    lyzrApiKey: {
      type: String,
      default: null,
      // This should be encrypted when stored
    },
    lyzrAgentId: {
      type: String,
      default: null,
    },
    lyzrKnowledgeBaseId: {
      type: String,
      default: null,
    },
    lyzrToolIds: [{
      type: String,
    }],
    avatar: {
      type: String,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
    systemInstruction: {
      type: String,
      default: 'You are a helpful HR assistant. Provide accurate and professional responses to employee queries.',
      maxlength: [1000, 'System instruction cannot exceed 1000 characters'],
    },
    schemaVersion: {
      type: Number,
      default: 2,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
OrganizationSchema.index({ name: 1 });
OrganizationSchema.index({ createdBy: 1 });

// Clear the model if it exists to avoid schema conflicts and ensure schema changes are applied
if (mongoose.models.Organization) {
  delete mongoose.models.Organization;
}

const Organization: Model<IOrganization> = mongoose.model<IOrganization>('Organization', OrganizationSchema);

export default Organization;
