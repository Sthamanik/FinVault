import mongoose, { Document, Schema } from 'mongoose';
import { createUniqueSlug } from '@utils/slug.utils.js';

export const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export interface ICareer extends Document {
  title: string;
  slug: string;
  department: string;
  location: string;
  type: JobType;
  description: string;
  requirements: string[];
  openings: number;
  isActive: boolean;
  isDeleted: boolean;
}

const careerSchema = new Schema<ICareer>(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: JOB_TYPES,
      required: [true, 'Job type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    requirements: {
      type: [String],
      default: [],
    },
    openings: {
      type: Number,
      default: 1,
      min: 1, 
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
// Auto-generate slug from title
careerSchema.pre('save', async function () {
  if (!this.isModified('title')) return;
    this.slug = await createUniqueSlug(this.title, mongoose.models.Career, this._id);
});

careerSchema.index({ isActive: 1, isDeleted: 1, createdAt: -1 });

const Career = mongoose.model<ICareer>('Career', careerSchema);

export default Career;