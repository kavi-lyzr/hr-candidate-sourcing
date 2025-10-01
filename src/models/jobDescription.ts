import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJobDescription {
  user: mongoose.Types.ObjectId;
  title: string;
  content: string;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobDescriptionDocument extends IJobDescription, Document {
  _id: Types.ObjectId;
}

const JobDescriptionSchema: Schema<IJobDescriptionDocument> = new Schema<IJobDescriptionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

if (mongoose.models.JobDescription) {
  delete mongoose.models.JobDescription;
}

export default mongoose.model<IJobDescriptionDocument>('JobDescription', JobDescriptionSchema);
