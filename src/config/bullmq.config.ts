import { ConnectionOptions } from "bullmq";

const bullmqConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

export default bullmqConnection;