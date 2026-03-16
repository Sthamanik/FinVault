import { Router } from "express";
import TeamController from "@controllers/team/team.controller.js";
import { verifyJWT } from "@middlewares/auth.middleware.js";
import asyncHandler from "@utils/asyncHandler.utils.js";
import upload from "@config/multer.js";
import { ValidateCreateTeam, ValidateUpdateTeam } from "@validations/team.validation.js";

class TeamRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    // Public
    this.router.get(
      "/",
      asyncHandler(TeamController.getAll.bind(TeamController))
    );
    this.router.get(
      "/:id",
      asyncHandler(TeamController.getById.bind(TeamController))
    );

    // Admin protected
    this.router.post(
      "/",
      verifyJWT,
      upload.single("profilePhoto"),
      ValidateCreateTeam,
      asyncHandler(TeamController.create.bind(TeamController))
    );

    this.router.patch(
      "/:id",
      verifyJWT,
      upload.single("profilePhoto"),
      ValidateUpdateTeam,
      asyncHandler(TeamController.update.bind(TeamController))
    );

    this.router.delete(
      "/:id",
      verifyJWT,
      asyncHandler(TeamController.delete.bind(TeamController))
    );

    this.router.patch(
      "/:id/toggle-active",
      verifyJWT,
      asyncHandler(TeamController.toggleActive.bind(TeamController))
    );
  }
}

export default new TeamRoute().router;
