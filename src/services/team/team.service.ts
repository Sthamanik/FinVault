import Team from "@models/team.model.js";
import { ApiError } from "@utils/apiError.utils.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "@utils/cloudinary.utils.js";

interface CreateTeamData {
  name: string;
  role: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
  };
  isActive?: boolean;
  order?: number;
}

interface GetAllTeamsQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

class TeamService {
  // Create team member
  async create(data: CreateTeamData, imagePath?: string) {
    let profilePhoto: { url: string; public_id: string } | undefined;

    if (imagePath) {
      const uploaded = await uploadOnCloudinary(imagePath);
      if (!uploaded) {
        throw new ApiError(500, "Failed to upload profile photo");
      }
      profilePhoto = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    const team = await Team.create({
      ...data,
      ...(profilePhoto && { profilePhoto }),
    });

    return team;
  }

  // Get all team members
  async getAll(query: GetAllTeamsQuery) {
    const { page = 1, limit = 10, isActive, search } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { isDeleted: false };

    if (typeof isActive === "boolean") {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    const [teams, total] = await Promise.all([
      Team.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Team.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      teams,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  // Get team member by id
  async getById(id: string) {
    const team = await Team.findOne({ _id: id, isDeleted: false });

    if (!team) {
      throw new ApiError(404, "Team member not found");
    }

    return team;
  }

  // Update team member
  async update(id: string, data: Partial<CreateTeamData>, imagePath?: string) {
    const team = await Team.findOne({ _id: id, isDeleted: false });

    if (!team) {
      throw new ApiError(404, "Team member not found");
    }

    let profilePhoto = team.profilePhoto;

    if (imagePath) {
      if (team.profilePhoto?.public_id) {
        await deleteFromCloudinary(team.profilePhoto.public_id);
      }

      const uploaded = await uploadOnCloudinary(imagePath);
      if (!uploaded) {
        throw new ApiError(500, "Failed to upload profile photo");
      }
      profilePhoto = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    const updated = await Team.findByIdAndUpdate(
      id,
      { $set: { ...data, profilePhoto } },
      { returnDocument: "after", runValidators: true }
    );

    return updated;
  }

  // Soft delete team member
  async delete(id: string) {
    const team = await Team.findOne({ _id: id, isDeleted: false });

    if (!team) {
      throw new ApiError(404, "Team member not found");
    }

    if (team.profilePhoto?.public_id) {
      await deleteFromCloudinary(team.profilePhoto.public_id);
    }

    await Team.findByIdAndUpdate(id, { $set: { isDeleted: true } });

    return null;
  }

  // Toggle isActive
  async toggleActive(id: string) {
    const team = await Team.findOne({ _id: id, isDeleted: false });

    if (!team) {
      throw new ApiError(404, "Team member not found");
    }

    team.isActive = !team.isActive;
    await team.save();

    return team;
  }
}

export default new TeamService();
