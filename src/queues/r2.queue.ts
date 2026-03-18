import { Queue } from "bullmq";
import bullmqConnection from "@config/bullmq.config.js";

export interface R2DeleteJobData {
  type: "r2.delete";
  payload: {
    publicId: string;
  };
}

export type R2JobData = R2DeleteJobData;

const r2Queue = new Queue<R2JobData>("r2", {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

export const enqueueR2Delete = async (publicId: string) => {
  await r2Queue.add("r2.delete", {
    type: "r2.delete",
    payload: { publicId },
  });
};

export default r2Queue;