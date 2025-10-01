import mongoose, { Document, Model, Schema } from 'mongoose';
import { ITicket } from './Ticket';
import { IUser } from './User';

export type MessageRole = 'user' | 'agent' | 'system' | 'resolver';

export interface ITicketMessage extends Document {
  _id: string;
  ticketId: Schema.Types.ObjectId | ITicket;
  role: MessageRole;
  content: string;
  userId: Schema.Types.ObjectId | IUser;
  attachments?: string[]; // Array of file URLs/paths
  isInternal?: boolean; // For internal notes not visible to ticket creator
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema: Schema<ITicketMessage> = new Schema(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: [true, 'Ticket ID is required'],
    },
    role: {
      type: String,
      enum: ['user', 'agent', 'system', 'resolver'],
      required: [true, 'Message role is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    attachments: [{
      type: String,
      trim: true,
    }],
    isInternal: {
      type: Boolean,
      default: false,
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

// Create indexes for better performance
TicketMessageSchema.index({ ticketId: 1, createdAt: 1 });
TicketMessageSchema.index({ userId: 1 });

// Clear the model if it exists to avoid schema conflicts and ensure schema changes are applied
if (mongoose.models.TicketMessage) {
  delete mongoose.models.TicketMessage;
}

const TicketMessage: Model<ITicketMessage> = mongoose.model<ITicketMessage>('TicketMessage', TicketMessageSchema);

export default TicketMessage;
