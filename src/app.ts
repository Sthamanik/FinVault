import express, {type Express} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "@middlewares/errorHandler.middleware.js";
import helmet from "helmet";
import { defaultLimiter } from "@middlewares/rateLimit.middleware.js";

// API Routes import 
import adminRouter from "@routes/admin/admin.route.js";
import serviceRouter from "@routes/services/services.route.js";
import blogRouter from "@routes/blog/blog.route.js";
import careerRouter from "@routes/career/career.route.js";
import contactRouter from "@routes/contact/contact.route.js";
import rewardRouter from "@routes/reward/reward.route.js";
import teamRouter from "@routes/team/team.route.js";
import applicationRouter from "@routes/application/application.route.js";
import logger from '@utils/logger.utils.js';
import { pinoHttp } from "pino-http";

const app: Express = express();

// App configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(helmet())
app.use(pinoHttp({logger}))
app.use(defaultLimiter)

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());



// Health check endpoint
app.get("/health", (_, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes initialization
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/services", serviceRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/careers", careerRouter);
app.use("/api/v1/contacts", contactRouter);
app.use("/api/v1/rewards", rewardRouter);
app.use("/api/v1/teams", teamRouter);
app.use("/api/v1/applications", applicationRouter);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
  });
});

// Error handling middleware (should be last)
app.use(errorHandler as any);

export default app;