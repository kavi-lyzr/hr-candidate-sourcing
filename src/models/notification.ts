import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification {
  user: mongoose.Types.ObjectId;
  message: string;
  type: 'info' | 'warning' | 'error';
  read: boolean;
  metadata?: object;
  createdAt: Date;
}

export interface INotificationDocument extends INotification, Document {
  _id: Types.ObjectId;
}

const NotificationSchema: Schema<INotificationDocument> = new Schema<INotificationDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'error'], default: 'info' },
    read: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.model<INotificationDocument>('Notification', NotificationSchema);
