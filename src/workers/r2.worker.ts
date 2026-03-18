import { Worker, Job } from "bullmq";
import bullmqConnection from "@config/bullmq.config.js";
import { deleteFromR2 } from "@utils/r2.utils.js";
import logger from "@utils/logger.utils.js";
import { R2JobData } from "@queues/r2.queue.js";

const processR2Job = async (job: Job<R2JobData>) => {
  const { data } = job;

  switch (data.type) {
    case "r2.delete": {
      const { publicId } = data.payload;
      const result = await deleteFromR2(publicId);

      if (!result) {
        throw new Error(`R2 delete failed for key: ${publicId}`);
      }

      logger.info(`[r2.worker] Deleted R2 object: ${publicId}`);
      break;
    }

    default:
      logger.warn(`[r2.worker] Unknown job type received`);
  }
};

const r2Worker = new Worker<R2JobData>("r2", processR2Job, {
  connection: bullmqConnection,
  concurrency: 3,
});

r2Worker.on("completed", (job) => {
  logger.info(`[r2.worker] Job ${job.id} (${job.name}) completed`);
});

r2Worker.on("failed", (job, err) => {
  logger.error(
    `[r2.worker] Job ${job?.id} (${job?.name}) failed — attempt ${job?.attemptsMade}: ${err.message}`
  );
});

r2Worker.on("error", (err) => {
  logger.error(`[r2.worker] Worker error: ${err.message}`);
});

export default r2Worker;