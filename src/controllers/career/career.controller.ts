import { Request, Response } from "express";
import { ApiResponse } from "@utils/apiResponse.utils.js";
import CareerService from "@services/career/career.service.js";

class CareerController {
  // Create career
  async create(req: Request, res: Response) {
    const career = await CareerService.create(req.body);

    res
      .status(201)
      .json(new ApiResponse(201, career, "Career created successfully"));
  }

  // Get all careers
  async getAll(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    let isActive: boolean | undefined;
    if (req.query.isActive === "true") isActive = true;
    if (req.query.isActive === "false") isActive = false;

    const result = await CareerService.getAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isActive,
      search: search as string | undefined,
    });

    res
      .status(200)
      .json(new ApiResponse(200, result, "Careers fetched successfully"));
  }

  // Get career by id
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const career = await CareerService.getById(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, career, "Career fetched successfully"));
  }

  // Get career by slug
  async getBySlug(req: Request, res: Response) {
    const { slug} = req.params;

    const career = await CareerService.getBySlug(slug as string);

    res
      .status(200)
      .json(new ApiResponse(200, career, "Career fetched successfully"));
  }

  // Update career
  async update(req: Request, res: Response) {
    const { id } = req.params;

    const career = await CareerService.update(id as string, req.body);

    res
      .status(200)
      .json(new ApiResponse(200, career, "Career updated successfully"));
  }

  // Soft delete career
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    await CareerService.delete(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Career deleted successfully"));
  }

  // restore soft deleted career
  async restore(req: Request, res: Response) {
    const { id } = req.params;

    await CareerService.restore(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Career restored successfully"));
  }

  // Delete career
  async hardDelete(req: Request, res: Response) {
    const { id } = req.params;

    await CareerService.hardDelete(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Career deleted permanently"));
  }

  // Toggle isActive
  async toggleActive(req: Request, res: Response) {
    const { id } = req.params;

    const career = await CareerService.toggleActive(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, career, "Career status toggled successfully"));
  }
}

export default new CareerController();
