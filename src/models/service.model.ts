import mongoose, { Document, Schema } from 'mongoose';
import { createUniqueSlug } from '@utils/slug.utils.js';

export const INDUSTRIES = [
  'Technology',
  'Healthcare & Pharmaceuticals',
  'Finance & Banking',
  'Real Estate',
  'Energy & Utilities',
  'Consumer Goods & Retail',
  'Infrastructure & Construction',
  'Agriculture & Commodities',
  'Manufacturing & Industrials',
  'Telecommunications',
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export interface IService extends Document {
  title: string;
  slug: string;
  shortDescription: string;
  longDescription?: string;
  image?: {
    url: string;
    public_id: string;
  };
  ctaLink?: string;
  investmentFocus?: string;
  industriesPortfolio: Industry[];
  isActive: boolean;
  order: number;
  isDeleted: boolean;
}

const serviceSchema = new Schema<IService>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
    },
    longDescription: {
      type: String,
      trim: true,
    },
    image: {
      url: { type: String },
      public_id: { type: String },
    },
    ctaLink: {
      type: String,
      trim: true,
    },
    investmentFocus: {
      type: String,
      trim: true,
    },
    industriesPortfolio: {
      type: [String],
      enum: INDUSTRIES,
      default: [],
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

// Auto-generate slug from title
serviceSchema.pre('save', async function () {
  if (!this.isModified('title')) return;
  this.slug = await createUniqueSlug(this.title, mongoose.models.Service, this._id);
});

serviceSchema.index({ isActive: 1, isDeleted: 1, order: 1 });

const Service = mongoose.model<IService>('Service', serviceSchema);

export default Service;