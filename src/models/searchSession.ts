import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISearchSession {
  user: mongoose.Types.ObjectId;
  initialQuery: string;
  attachedJd?: mongoose.Types.ObjectId;
  conversationHistory: { role: string; content: string; timestamp: Date }[];
  schemaVersion: number;
}

export interface ISearchSessionDocument extends ISearchSession, Document {
  _id: Types.ObjectId;
}

const SearchSessionSchema: Schema<ISearchSessionDocument> = new Schema<ISearchSessionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    initialQuery: { type: String, required: true },
    attachedJd: { type: Schema.Types.ObjectId, ref: 'JobDescription' },
    conversationHistory: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, required: true },
      },
    ],
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

if (mongoose.models.SearchSession) {
  delete mongoose.models.SearchSession;
}

export default mongoose.model<ISearchSessionDocument>('SearchSession', SearchSessionSchema);
