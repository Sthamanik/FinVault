import fs from "node:fs";
import path from "node:path";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo: MongoMemoryServer;

vi.mock("@utils/r2.utils.js", () => ({
  uploadToR2: async (localFilePath: string) => {
    if (!localFilePath) return null;
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    return {
      secure_url: `https://r2.test/${path.basename(localFilePath)}`,
      public_id: `test_${Date.now()}`,
    };
  },
  deleteFromR2: async (_publicId: string) => ({ result: "ok" }),
}));

// Mock BullMQ — no real Redis queue in tests
vi.mock("@queues/email.queue.js", () => ({
  enqueueContactNotification: vi.fn().mockResolvedValue(undefined),
  enqueueApplicationNotification: vi.fn().mockResolvedValue(undefined),
  enqueueApplicationStatusNotification: vi.fn().mockResolvedValue(undefined),
  default: {},
}));

// Mock nodemailer — no real SMTP in tests
vi.mock("@config/mailer.config.js", () => ({
  default: {
    sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" }),
  },
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