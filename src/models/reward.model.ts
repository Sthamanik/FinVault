import mongoose, { Document, Schema } from 'mongoose';

export interface IReward extends Document {
  title: string;
  issuer: string;
  description?: string;
  image?: {
    url: string;
    public_id: string;
  };
  credentialUrl?: string;
  issueDate?: Date;
  isDeleted: boolean;
}

const rewardSchema = new Schema<IReward>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    issuer: {
      type: String,
      required: [true, 'Issuer is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      url: { type: String },
      public_id: { type: String },
    },
    credentialUrl: {
      type: String,
      trim: true,
    },
    issueDate: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// add Composite indexes
rewardSchema.index(
  { title: 1, issuer: 1, isDeleted: 1 },
  { unique: true, name: 'unique_reward' }
);
rewardSchema.index({ isDeleted: 1, createdAt: -1 });

const Reward = mongoose.model<IReward>('Reward', rewardSchema);

export default Reward;