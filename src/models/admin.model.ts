import mongoose, { Document, Schema } from 'mongoose';
import argon2 from 'argon2';

export interface IAdmin extends Document {
  email: string;
  password: string;
  refreshToken?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await argon2.hash(this.password);
});

// Compare password method
adminSchema.methods.comparePassword = async function (
  this: IAdmin,
  candidatePassword: string
): Promise<boolean> {
  return argon2.verify(this.password, candidatePassword);
};

const Admin = mongoose.model<IAdmin>('Admin', adminSchema);

export default Admin;