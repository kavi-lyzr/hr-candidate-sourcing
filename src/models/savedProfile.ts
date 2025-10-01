import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISavedProfile {
  user: mongoose.Types.ObjectId;
  candidate: mongoose.Types.ObjectId;
  searchSession: mongoose.Types.ObjectId;
  schemaVersion: number;
}

export interface ISavedProfileDocument extends ISavedProfile, Document {
  _id: Types.ObjectId;
}

const SavedProfileSchema: Schema<ISavedProfileDocument> = new Schema<ISavedProfileDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'CandidateProfile', required: true },
    searchSession: { type: Schema.Types.ObjectId, ref: 'SearchSession', required: true, index: true },
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

SavedProfileSchema.index({ user: 1, candidate: 1, searchSession: 1 }, { unique: true });

if (mongoose.models.SavedProfile) {
  delete mongoose.models.SavedProfile;
}

export default mongoose.model<ISavedProfileDocument>('SavedProfile', SavedProfileSchema);
