import Team from "@models/team.model.js";
import { ApiError } from "@utils/apiError.utils.js";
import { uploadToR2 } from "@utils/r2.utils.js";
import cache from '@utils/cache.utils.js';
import { CreateTeamData, GetAllTeamsQuery } from "@interfaces/team.interface.js";
import { enqueueR2Delete } from "@queues/r2.queue.js";
import logger from "@utils/logger.utils.js";

class TeamService {
  // Create team member
  async create(data: CreateTeamData, imagePath?: string) {
    let profilePhoto: { url: string; public_id: string } | undefined;

    if (imagePath) {
      const uploaded = await uploadToR2(imagePath);
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

    // increment the team version in cache
    await cache.incrementVersion('team');
    return team;
  }

  // Get all team members
  async getAll(query: GetAllTeamsQuery) {
    const { page = 1, limit = 10, isActive, search } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // create the key to cache
    const version = await cache.getVersion('team');
    const key = `team:v${version}:${page}:${limit}:${isActive??''}:${search??''}`;

    // search the key in cache and return if hit 
    const data = await cache.get(key);
    if (data) return data;

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
    const result = {
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
    
    // set the result in cache and return 
    await cache.set(key, result, 900);
    return result;
  }

  // Get team member by id
  async getById(id: string) {
    // create a key to cache 
    const key = `team:id:${id}`;

    // search the cache and return if hit 
    const data = await cache.get(key);
    if (data) return data;

    const team = await Team.findOne({ _id: id, isDeleted: false });
    if (!team) {
      throw new ApiError(404, "Team member not found");
    }

    // set team to cache and return 
    await cache.set(key, team, 900);
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
        enqueueR2Delete(team.profilePhoto.public_id).catch((err) =>
          logger.error(`team failed to enqueue R2 delete: ${err.message}`)
        );
      }

      const uploaded = await uploadToR2(imagePath);
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

    // remove team key and increment update version 
    await Promise.all([
      cache.delete(`team:id:${id}`),
      cache.incrementVersion('team')
    ])
    return updated;
  }

  // soft delete the team
  async delete(id: string) {
    const team = await Team.findOne({ _id: id, isDeleted: false });
    if (!team) {
      throw new ApiError(404, "Team member not found");
    }

    await Team.findByIdAndUpdate(id, { $set: { isDeleted: true } });

    await Promise.all([
      cache.delete(`team:id:${id}`),
      cache.incrementVersion("team"),
    ]);
    return null;
  }

  // restore the soft deleted one
  async restore(id: string) {
    const team = await Team.findOne({ _id: id, isDeleted: true });
    if (!team) throw new ApiError(404, "Team member not found or not deleted");

    await Team.findByIdAndUpdate(id, { $set: { isDeleted: false } });

    await Promise.all([
      cache.delete(`team:id:${id}`),
      cache.incrementVersion("team"),
    ]);
    return null;
  }

  // hard delete
  async hardDelete(id: string) {
    const team = await Team.findOne({ _id: id, isDeleted: true });
    if (!team) throw new ApiError(404, "Team member not found or not soft-deleted first");

    if (team.profilePhoto?.public_id) {
      enqueueR2Delete(team.profilePhoto.public_id).catch((err) =>
        logger.error(`team failed to enqueue R2 delete: ${err.message}`)
      );
    }

    await Team.findByIdAndDelete(id);

    await Promise.all([
      cache.delete(`team:id:${id}`),
      cache.incrementVersion("team"),
    ]);
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

    // remove team key and increment update version 
    await Promise.all([
      cache.delete(`team:id:${id}`),
      cache.incrementVersion('team')
    ])
    return team;
  }
}

export default new TeamService();
