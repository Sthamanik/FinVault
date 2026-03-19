import { Request, Response } from 'express';
import { ApiResponse } from '@utils/apiResponse.utils.js';
import DashboardService from '@services/admin/dashboard.service.js';

class DashboardController {
  async getSummary(req: Request, res: Response) {
    const data = await DashboardService.getSummary();

    res
      .status(200)
      .json(new ApiResponse(200, data, 'Dashboard summary fetched successfully'));
  }
}

export default new DashboardController();