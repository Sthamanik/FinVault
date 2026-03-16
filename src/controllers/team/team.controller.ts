import { Request, Response } from "express";
import { ApiResponse } from "@utils/apiResponse.utils.js";
import TeamService from "@services/team/team.service.js";

class TeamController {
  // Create team member
  async create(req: Request, res: Response) {
    const imagePath = req.file?.path;
    const team = await TeamService.create(req.body, imagePath);

    res
      .status(201)
      .json(new ApiResponse(201, team, "Team member created successfully"));
  }

  // Get all team members
  async getAll(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    let isActive: boolean | undefined;
    if (req.query.isActive === "true") isActive = true;
    if (req.query.isActive === "false") isActive = false;

    const result = await TeamService.getAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isActive,
      search: search as string | undefined,
    });

    res
      .status(200)
      .json(new ApiResponse(200, result, "Team members fetched successfully"));
  }

  // Get team member by id
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const team = await TeamService.getById(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, team, "Team member fetched successfully"));
  }

  // Update team member
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const imagePath = req.file?.path;

    const team = await TeamService.update(id as string, req.body, imagePath);

    res
      .status(200)
      .json(new ApiResponse(200, team, "Team member updated successfully"));
  }

  // Delete team member
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    await TeamService.delete(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Team member deleted successfully"));
  }

  // Toggle isActive
  async toggleActive(req: Request, res: Response) {
    const { id } = req.params;

    const team = await TeamService.toggleActive(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, team, "Team status toggled successfully"));
  }
}

export default new TeamController();
