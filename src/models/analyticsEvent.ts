import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAnalyticsEvent {
  user: mongoose.Types.ObjectId;
  eventType: string;
  metadata?: any;
}

export interface IAnalyticsEventDocument extends IAnalyticsEvent, Document {
  _id: Types.ObjectId;
}

const AnalyticsEventSchema: Schema<IAnalyticsEventDocument> = new Schema<IAnalyticsEventDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventType: {
      type: String,
      required: true,
      enum: [
        'USER_LOGIN',
        'CANDIDATE_SEARCH_INITIATED',
        'PROFILE_SAVED',
        'MATCHING_COMPLETED',
      ],
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { updatedAt: false } } // Only createdAt
);

if (mongoose.models.AnalyticsEvent) {
  delete mongoose.models.AnalyticsEvent;
}

export default mongoose.model<IAnalyticsEventDocument>('AnalyticsEvent', AnalyticsEventSchema);
