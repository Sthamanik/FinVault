import { Request, Response } from "express";
import { ApiResponse } from "@utils/apiResponse.utils.js";
import ApplicationService from "@services/application/application.service.js";

class ApplicationController {
  // Create application
  async create(req: Request, res: Response) {
    const { jobId } = req.params;

    const files =
      (req.files as Record<string, Express.Multer.File[]>) || undefined;
    const resumeFile = files?.resume?.[0];
    const coverLetterFile = files?.coverLetterFile?.[0];

    const application = await ApplicationService.create(
      jobId as string,
      req.body,
      resumeFile?.path,
      coverLetterFile?.path
    );

    res
      .status(201)
      .json(new ApiResponse(201, application, "Application submitted"));
  }

  // Get all applications
  async getAll(req: Request, res: Response) {
    const { page, limit, status, jobId, search } = req.query;

    const result = await ApplicationService.getAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string | undefined,
      jobId: jobId as string | undefined,
      search: search as string | undefined,
    });

    res
      .status(200)
      .json(new ApiResponse(200, result, "Applications fetched successfully"));
  }

  // Get application by id
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const application = await ApplicationService.getById(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, application, "Application fetched successfully"));
  }

  // Update application status
  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    const application = await ApplicationService.updateStatus(id as string, status);

    res
      .status(200)
      .json(new ApiResponse(200, application, "Application status updated"));
  }

  // Soft delete application
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    await ApplicationService.delete(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Application deleted successfully"));
  }

  // Restore the soft deleted one
  async restore(req: Request, res: Response) {
    const { id } = req.params;

    await ApplicationService.restore(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Application restored successfully"));
  }

  async hardDelete(req: Request, res: Response) {
    const { id } = req.params;

    await ApplicationService.hardDelete(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Application deleted permanently"));
  }
}

export default new ApplicationController();
