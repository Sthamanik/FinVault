import { Request, Response } from "express";
import { ApiResponse } from "@utils/apiResponse.utils.js";
import BlogService from "@services/blog/blog.service.js";

class BlogController {
  // Create blog
  async create(req: Request, res: Response) {
    const imagePath = req.file?.path;
    const blog = await BlogService.create(req.body, imagePath);

    res
      .status(201)
      .json(new ApiResponse(201, blog, "Blog created successfully"));
  }

  // Get all blogs
  async getAll(req: Request, res: Response) {
    const { page, limit, status, category, tag, search } = req.query;

    const result = await BlogService.getAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string | undefined,
      category: category as string | undefined,
      tag: tag as string | undefined,
      search: search as string | undefined,
    });

    res
      .status(200)
      .json(new ApiResponse(200, result, "Blogs fetched successfully"));
  }

  // Get blog by id
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const blog = await BlogService.getById(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, blog, "Blog fetched successfully"));
  }

  // Get blog by slug
  async getBySlug(req: Request, res: Response) {
    const { slug } = req.params;

    const blog = await BlogService.getBySlug(slug as string);

    res
      .status(200)
      .json(new ApiResponse(200, blog, "Blog fetched successfully"));
  }

  // Update blog
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const imagePath = req.file?.path;

    const blog = await BlogService.update(id as string, req.body, imagePath);

    res
      .status(200)
      .json(new ApiResponse(200, blog, "Blog updated successfully"));
  }

  // Soft delete blog
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    await BlogService.delete(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Blog deleted successfully"));
  }
  
  // Restore the soft deleted blog
  async restore(req: Request, res: Response) {
    const { id } = req.params;

    await BlogService.restore(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Blog restored successfully"));
  }

  // Delete blog
  async hardDelete(req: Request, res: Response) {
    const { id } = req.params;

    await BlogService.hardDelete(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Blog deleted permanently"));
  }
}

export default new BlogController();
