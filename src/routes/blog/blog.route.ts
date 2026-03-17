import { Router } from "express";
import BlogController from "@controllers/blog/blog.controller.js";
import { verifyJWT } from "@middlewares/auth.middleware.js";
import { authenticatedLimiter } from "@middlewares/rateLimit.middleware.js";
import asyncHandler from "@utils/asyncHandler.utils.js";
import upload from "@config/multer.js";
import {
  validateCreateBLog,
  validateUpdateBlog,
} from "@validations/blog.validation.js";

class BlogRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    // Public
    this.router.get("/", asyncHandler(BlogController.getAll.bind(BlogController)));
    this.router.get(
      "/slug/:slug",
      asyncHandler(BlogController.getBySlug.bind(BlogController))
    );

    // Admin protected
    this.router.get(
      "/:id",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(BlogController.getById.bind(BlogController))
    );

    this.router.post(
      "/",
      verifyJWT,
      authenticatedLimiter,
      upload.single("featuredImage"),
      validateCreateBLog,
      asyncHandler(BlogController.create.bind(BlogController))
    );

    this.router.patch(
      "/:id",
      verifyJWT,
      authenticatedLimiter,
      upload.single("featuredImage"),
      validateUpdateBlog,
      asyncHandler(BlogController.update.bind(BlogController))
    );

    this.router.delete(
      "/:id",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(BlogController.delete.bind(BlogController))
    );
  }
}

export default new BlogRoute().router;
