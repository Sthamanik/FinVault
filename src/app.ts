import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "@middlewares/errorHandler.middleware.js";
import helmet from "helmet";

// API Routes import 
import adminRouter from "@routes/admin.route.js";

const app = express();

// App configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(helmet())

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());



// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes initialization
app.use("/api/v1/admin", adminRouter);

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
