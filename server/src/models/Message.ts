import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  room: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image';
  readBy: mongoose.Types.ObjectId[];
}

const messageSchema = new Schema<IMessage>(
  {
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'image'], default: 'text' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

messageSchema.index({ room: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', messageSchema);
