import mongoose, { Document, Model, Schema } from 'mongoose';
import { IOrganization } from './Organization';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  lyzrUserId?: string; // ID from Lyzr Studio
  lyzrApiKey?: string; // Encrypted API key from Lyzr
  lyzrOrganizationId?: string; // Current org ID from Lyzr
  lyzrPolicyId?: string; // Policy ID from Lyzr  
  lyzrUsageId?: string; // Usage ID from Lyzr
  lyzrRole?: string; // Role in Lyzr (e.g., "owner")
  lyzrCredits?: string; // Available credits
  currentOrganization?: Schema.Types.ObjectId | IOrganization;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    avatar: {
      type: String,
      default: null,
    },
    lyzrUserId: {
      type: String,
      sparse: true, // Allows null values while maintaining uniqueness for non-null values
      unique: true,
    },
    lyzrApiKey: {
      type: String,
      default: null,
      // This will store encrypted API key
    },
    lyzrOrganizationId: {
      type: String,
      default: null,
    },
    lyzrPolicyId: {
      type: String,
      default: null,
    },
    lyzrUsageId: {
      type: String,
      default: null,
    },
    lyzrRole: {
      type: String,
      default: null,
    },
    lyzrCredits: {
      type: String,
      default: null,
    },
    currentOrganization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    schemaVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes are already created via unique: true in field definitions

// Clear the model if it exists to avoid schema conflicts and ensure schema changes are applied
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
