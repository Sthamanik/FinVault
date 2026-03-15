import mongoose, { Document, Schema } from 'mongoose';

export const CONTACT_SUBJECTS = [
  'Portfolio Management',
  'Mutual Fund Advisory',
  'Retirement Planning',
  'Tax Planning',
  'Wealth Management',
  'Stock Market Advisory',
  'General Inquiry',
  'Partnership',
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export const CONTACT_STATUSES = ['new', 'read', 'resolved'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export interface IContact extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: ContactSubject;
  message: string;
  status: ContactStatus;
  isDeleted: boolean;
}

const contactSchema = new Schema<IContact>(
  {
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
    subject: {
      type: String,
      enum: CONTACT_SUBJECTS,
      required: [true, 'Subject is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: CONTACT_STATUSES,
      default: 'new',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

contactSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });

const Contact = mongoose.model<IContact>('Contact', contactSchema);

export default Contact;