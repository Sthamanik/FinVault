import { Request, Response } from "express";
import { ApiResponse } from "@utils/apiResponse.utils.js";
import RewardService from "@services/reward/reward.service.js";

class RewardController {
  // Create reward
  async create(req: Request, res: Response) {
    const imagePath = req.file?.path;
    const reward = await RewardService.create(req.body, imagePath);

    res
      .status(201)
      .json(new ApiResponse(201, reward, "Reward created successfully"));
  }

  // Get all rewards
  async getAll(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const result = await RewardService.getAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string | undefined,
    });

    res
      .status(200)
      .json(new ApiResponse(200, result, "Rewards fetched successfully"));
  }

  // Get reward by id
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const reward = await RewardService.getById(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, reward, "Reward fetched successfully"));
  }

  // Update reward
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const imagePath = req.file?.path;

    const reward = await RewardService.update(id as string, req.body, imagePath);

    res
      .status(200)
      .json(new ApiResponse(200, reward, "Reward updated successfully"));
  }

  // Soft delete reward
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    await RewardService.delete(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Reward deleted successfully"));
  }

  // restore soft deleted reward
  async restore(req: Request, res: Response) {
    const { id } = req.params;

    await RewardService.restore(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Reward restored successfully"));
  }

  // Delete reward
  async hardDelete(req: Request, res: Response) {
    const { id } = req.params;

    await RewardService.hardDelete(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Reward deleted permanently"));
  }
}

export default new RewardController();
