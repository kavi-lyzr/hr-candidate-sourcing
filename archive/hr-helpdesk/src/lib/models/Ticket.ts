import mongoose, { Document, Model, Schema } from 'mongoose';
import { IUser } from './User';
import { IOrganization } from './Organization';
import { IDepartment } from './Department';

export type TicketStatus = 'open' | 'in_progress' | 'pending_information' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITicket extends Document {
  _id: string;
  trackingNumber: number;
  title: string;
  description: string;
  category?: string;
  department?: Schema.Types.ObjectId | IDepartment;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: Schema.Types.ObjectId[] | IUser[]; // Array of user IDs
  createdBy: Schema.Types.ObjectId | IUser;
  organizationId: Schema.Types.ObjectId | IOrganization;
  tags?: string[];
  dueDate?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema<ITicket> = new Schema(
  {
    trackingNumber: {
      type: Number,
      required: false, // Will be set by pre-save hook
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      required: [true, 'Priority is required'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'pending_information', 'resolved', 'closed'],
      required: [true, 'Status is required'],
      default: 'open',
    },
    assignedTo: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    tags: [{
      type: String,
      trim: true,
    }],
    dueDate: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
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

// Auto-increment tracking number
TicketSchema.pre('save', async function (next) {
  if (this.isNew && !this.trackingNumber) {
    try {
      const lastTicket = await mongoose.model('Ticket').findOne().sort({ trackingNumber: -1 });
      this.trackingNumber = lastTicket ? lastTicket.trackingNumber + 1 : 1000;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Update resolved/closed timestamps
TicketSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

// Create indexes for better performance
TicketSchema.index({ organizationId: 1, status: 1 });
TicketSchema.index({ organizationId: 1, createdBy: 1 });
TicketSchema.index({ organizationId: 1, assignedTo: 1 });
TicketSchema.index({ organizationId: 1, department: 1 });
TicketSchema.index({ createdAt: -1 });
// Compound index for common filter combinations
TicketSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
TicketSchema.index({ organizationId: 1, department: 1, status: 1 });
// Text index for search functionality
TicketSchema.index({ 
  title: 'text', 
  description: 'text' 
}, { 
  weights: { title: 10, description: 5 } 
});

// Clear the model if it exists to avoid schema conflicts and ensure schema changes are applied
if (mongoose.models.Ticket) {
  delete mongoose.models.Ticket;
}

const Ticket: Model<ITicket> = mongoose.model<ITicket>('Ticket', TicketSchema);

export default Ticket;
