import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  name: string;
  description?: string;
  members: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
}

const roomsSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true, trim: true, minlength: 3 },
    description: { type: String, trim: true, default: '' },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true },
);

export default mongoose.model<IRoom>('Room', roomsSchema);
