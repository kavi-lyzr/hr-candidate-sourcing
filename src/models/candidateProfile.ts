import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICandidateProfile {
  publicId: string;
  rawData: any;
  lastFetchedAt: Date;
  schemaVersion: number;
}

export interface ICandidateProfileDocument extends ICandidateProfile, Document {
  _id: Types.ObjectId;
}

const CandidateProfileSchema: Schema<ICandidateProfileDocument> = new Schema<ICandidateProfileDocument>(
  {
    publicId: { type: String, required: true, unique: true, index: true },
    rawData: { type: mongoose.Schema.Types.Mixed, required: true },
    lastFetchedAt: { type: Date, default: Date.now },
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

if (mongoose.models.CandidateProfile) {
  delete mongoose.models.CandidateProfile;
}

export default mongoose.model<ICandidateProfileDocument>('CandidateProfile', CandidateProfileSchema);
