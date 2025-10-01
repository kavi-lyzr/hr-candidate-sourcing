import mongoose, { Document, Model, Schema } from 'mongoose';
import { IOrganization } from './Organization';
import { IUser } from './User';

export type FileType = 'pdf' | 'docx' | 'txt' | 'url';

export interface IKnowledgeBase extends Document {
  _id: string;
  title: string;
  ragId?: string; // Lyzr RAG ID returned after training
  fileName: string;
  originalFileName: string; // Store original filename as uploaded
  fileType: FileType;
  fileSize: number; // In bytes
  organizationId: Schema.Types.ObjectId | IOrganization;
  uploadedBy: Schema.Types.ObjectId | IUser;
  status: 'processing' | 'active' | 'failed' | 'deleted';
  documentCount?: number; // Number of documents created from this file in RAG
  processingError?: string; // Error message if processing failed
  tags?: string[];
  description?: string;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeBaseSchema: Schema<IKnowledgeBase> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Knowledge base title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    ragId: {
      type: String,
      trim: true,
      sparse: true, // Allows null values while maintaining uniqueness for non-null values
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
      maxlength: [255, 'Original file name cannot exceed 255 characters'],
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'txt'],
      required: [true, 'File type is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploaded by is required'],
    },
    status: {
      type: String,
      enum: ['processing', 'active', 'failed', 'deleted'],
      default: 'processing',
    },
    documentCount: {
      type: Number,
      min: [0, 'Document count cannot be negative'],
    },
    processingError: {
      type: String,
      trim: true,
      maxlength: [1000, 'Processing error cannot exceed 1000 characters'],
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot exceed 50 characters'],
    }],
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
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
KnowledgeBaseSchema.index({ organizationId: 1, status: 1 });
KnowledgeBaseSchema.index({ organizationId: 1, tags: 1 });
KnowledgeBaseSchema.index({ ragId: 1 });
KnowledgeBaseSchema.index({ uploadedBy: 1 });

// Clear the model if it exists to avoid schema conflicts and ensure schema changes are applied
if (mongoose.models.KnowledgeBase) {
  delete mongoose.models.KnowledgeBase;
}

const KnowledgeBase: Model<IKnowledgeBase> = mongoose.model<IKnowledgeBase>('KnowledgeBase', KnowledgeBaseSchema);

export default KnowledgeBase;
