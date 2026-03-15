import mongoose, { Document, Schema, Types } from 'mongoose';

export const APPLICATION_STATUSES = ['pending', 'reviewed', 'shortlisted', 'rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface IApplication extends Document {
    jobId: Types.ObjectId;
    name: string;
    email: string;
    phone?: string;
    coverLetter?: string;
        coverLetterFile?: {
        url: string;
        public_id: string;
        };
    resume: {
        url: string;
        public_id: string;
    };
    status: ApplicationStatus;
    isDeleted: boolean;
}

const applicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Career',
      required: [true, 'Job reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    coverLetter: {
    type: String,
    trim: true,
    },
    coverLetterFile: {
    url: { type: String },
    public_id: { type: String },
    },
    resume: {
      url: {
        type: String,
        required: [true, 'Resume URL is required'],
      },
      public_id: {
        type: String,
        required: [true, 'Resume public_id is required'],
      },
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'pending',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, isDeleted: 1 });
applicationSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });

const Application = mongoose.model<IApplication>('Application', applicationSchema);

export default Application;