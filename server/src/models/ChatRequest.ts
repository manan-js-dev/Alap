import mongoose, { Document, Schema } from 'mongoose';

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface IChatRequest extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  status: RequestStatus;
  room?: mongoose.Types.ObjectId;
}

const chatRequestSchema = new Schema<IChatRequest>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    room: { type: Schema.Types.ObjectId, ref: 'Room' },
  },
  { timestamps: true },
);

// Prevent duplicate requests
chatRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

export default mongoose.model<IChatRequest>('ChatRequest', chatRequestSchema);
