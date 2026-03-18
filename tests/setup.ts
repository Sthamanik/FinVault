import fs from "node:fs";
import path from "node:path";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo: MongoMemoryServer;

vi.mock("@utils/cloudinary.utils.js", () => ({
  uploadOnCloudinary: async (localFilePath: string) => {
    if (!localFilePath) return null;

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return {
      secure_url: `https://cloudinary.test/${path.basename(localFilePath)}`,
      public_id: `test_${Date.now()}`,
    };
  },
  deleteFromCloudinary: async (_publicId: string) => ({ result: "ok" }),
  default: {},
}));

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await mongoose.syncIndexes();
}, 60000);

afterEach(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.syncIndexes();
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});