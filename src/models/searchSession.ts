import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISearchSession {
  user: mongoose.Types.ObjectId;
  title: string;
  initialQuery: string;
  attachedJd?: mongoose.Types.ObjectId;
  attachedJdTitle?: string;
  conversationHistory: { role: string; content: string; timestamp: Date }[];
  toolResults?: {
    allProfiles?: any[];
    timestamp?: Date;
  };
  schemaVersion: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISearchSessionDocument extends ISearchSession, Document {
  _id: Types.ObjectId;
}

const SearchSessionSchema: Schema<ISearchSessionDocument> = new Schema<ISearchSessionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    initialQuery: { type: String, required: true },
    attachedJd: { type: Schema.Types.ObjectId, ref: 'JobDescription' },
    attachedJdTitle: { type: String },
    conversationHistory: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, required: true },
      },
    ],
    toolResults: {
      type: {
        allProfiles: { type: Schema.Types.Mixed },
        timestamp: { type: Date },
      },
      required: false,
    },
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

if (mongoose.models.SearchSession) {
  delete mongoose.models.SearchSession;
}

export default mongoose.model<ISearchSessionDocument>('SearchSession', SearchSessionSchema);
