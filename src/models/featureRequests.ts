import mongoose, { Document, Model, Schema } from 'mongoose';

export type FeatureRequestStatus = 'open' | 'reviewed' | 'closed';

export interface IFeatureRequest extends Document {
  email: string;
  message: string;
  app: string; // slug or name of the app (e.g., "hr-helpdesk")
  pagePath?: string | null;
  userId?: mongoose.Types.ObjectId | null;
  status: FeatureRequestStatus;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureRequestSchema: Schema<IFeatureRequest> = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please enter a valid email'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [3, 'Message is too short'],
      maxlength: [5000, 'Message is too long'],
    },
    app: {
      type: String,
      required: [true, 'App identifier is required'],
      trim: true,
    },
    pagePath: {
      type: String,
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'reviewed', 'closed'],
      default: 'open',
      required: true,
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

// Helpful indexes for analytics later
FeatureRequestSchema.index({ app: 1, status: 1, createdAt: -1 });
FeatureRequestSchema.index({ email: 1, createdAt: -1 });

if (mongoose.models.FeatureRequest) {
  delete mongoose.models.FeatureRequest;
}

const FeatureRequest: Model<IFeatureRequest> = mongoose.model<IFeatureRequest>('FeatureRequest', FeatureRequestSchema);

export default FeatureRequest;
