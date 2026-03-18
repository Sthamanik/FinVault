import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  role: string;
  bio?: string;
  profilePhoto?: {
    url: string;
    public_id: string;
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
  };
  isActive: boolean;
  order: number;
  isDeleted: boolean;
}

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      url: { type: String },
      public_id: { type: String },
    },
    socialLinks: {
      linkedin: { type: String, trim: true },
      twitter: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// add composite indexes
teamSchema.index(
  { name: 1, role: 1, isDeleted: 1 },
  { unique: true, name: 'unique_team_member' }
);
teamSchema.index({ isActive: 1, isDeleted: 1, order: 1 });

const Team = mongoose.model<ITeam>('Team', teamSchema);

export default Team;