import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  featuredImage?: {
    url: string;
    public_id: string;
  };
  author: string;
  tags: string[];
  category?: string;
  status: 'draft' | 'published';
  metaTitle?: string;
  metaDescription?: string;
  readTime: number;
  isDeleted: boolean;
}

const blogSchema = new Schema<IBlog>(
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
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    featuredImage: {
      url: { type: String },
      public_id: { type: String },
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      default: 'Admin',
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    readTime: {
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
blogSchema.pre('save', async function () {
  if (!this.isModified('title')) return;

  const baseSlug = slugify(this.title, { lower: true, strict: true });

  // Handle duplicate slugs by appending a number
  let slug = baseSlug;
  let count = 1;
  while (await mongoose.models.Blog.findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }
  this.slug = slug;
});

// Auto-calculate read time from content
blogSchema.pre('save', async function () {
  if (!this.isModified('content')) return;
  const wordsPerMinute = 200;
  const wordCount = this.content.trim().split(/\s+/).length;
  this.readTime = Math.ceil(wordCount / wordsPerMinute);
});

// Add the compound index
blogSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });

const Blog = mongoose.model<IBlog>('Blog', blogSchema);

export default Blog;