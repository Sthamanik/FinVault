import { Request, Response } from 'express';
import { ApiResponse } from '@utils/apiResponse.utils.js';
import ServiceService from '@services/services/services.service.js';

class ServiceController {
  // Create service
  async create(req: Request, res: Response) {
    const imagePath = req.file?.path;

    const service = await ServiceService.create(req.body, imagePath);

    res
      .status(201)
      .json(new ApiResponse(201, service, 'Service created successfully'));
  }

  // Get all services
  async getAll(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    let isActive: boolean | undefined;
    if (req.query.isActive === 'true') isActive = true;
    if (req.query.isActive === 'false') isActive = false;

    const result = await ServiceService.getAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isActive,
      search: search as string | undefined,
    });

    res
      .status(200)
      .json(new ApiResponse(200, result, 'Services fetched successfully'));
  }

  // Get single service
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const service = await ServiceService.getById(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, service, 'Service fetched successfully'));
  }

  // Update service
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const imagePath = req.file?.path;

    const service = await ServiceService.update(id as string, req.body, imagePath);

    res
      .status(200)
      .json(new ApiResponse(200, service, 'Service updated successfully'));
  }

  // Delete service
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    await ServiceService.delete(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, 'Service deleted successfully'));
  }

  // Toggle isActive
  async toggleActive(req: Request, res: Response) {
    const { id } = req.params;

    const service = await ServiceService.toggleActive(id as string);

    res
      .status(200)
      .json(
        new ApiResponse(200, service, 'Service status toggled successfully')
      );
  }
}

export default new ServiceController();