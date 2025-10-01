import mongoose, { Document, Model, Schema } from 'mongoose';
import { IOrganization } from './Organization';
import { IUser } from './User';

export type UserRole = 'employee' | 'resolver' | 'manager' | 'admin';
export type UserStatus = 'active' | 'invited' | 'inactive';

export interface IOrganizationUser extends Document {
  _id: string;
  organizationId: Schema.Types.ObjectId | IOrganization;
  email: string;
  userId?: Schema.Types.ObjectId | IUser;
  role: UserRole;
  status: UserStatus;
  department?: Schema.Types.ObjectId | string;
  createdBy: Schema.Types.ObjectId | IUser;
  inviteToken?: string; // For invitation flow
  invitedAt?: Date;
  joinedAt?: Date;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationUserSchema: Schema<IOrganizationUser> = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    role: {
      type: String,
      enum: ['employee', 'resolver', 'manager', 'admin'],
      required: [true, 'Role is required'],
      default: 'employee',
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'inactive'],
      required: [true, 'Status is required'],
      default: 'invited',
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
    inviteToken: {
      type: String,
      default: null,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    joinedAt: {
      type: Date,
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

// Ensure unique combination of organization and email
OrganizationUserSchema.index({ organizationId: 1, email: 1 }, { unique: true });
OrganizationUserSchema.index({ organizationId: 1, userId: 1 });
OrganizationUserSchema.index({ email: 1 });
OrganizationUserSchema.index({ inviteToken: 1 });
// Optimize department user count queries
OrganizationUserSchema.index({ organizationId: 1, department: 1, status: 1 });
// Optimize role-based queries
OrganizationUserSchema.index({ organizationId: 1, role: 1 });
// Optimize status-based queries
OrganizationUserSchema.index({ organizationId: 1, status: 1 });

// Clear the model if it exists to avoid schema conflicts and ensure schema changes are applied
if (mongoose.models.OrganizationUser) {
  delete mongoose.models.OrganizationUser;
}

const OrganizationUser: Model<IOrganizationUser> = mongoose.model<IOrganizationUser>('OrganizationUser', OrganizationUserSchema);

export default OrganizationUser;
