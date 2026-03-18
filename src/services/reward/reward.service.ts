import Reward from "@models/reward.model.js";
import { ApiError } from "@utils/apiError.utils.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "@utils/cloudinary.utils.js";
import cache from '@utils/cache.utils.js';
import { CreateRewardData, GetAllRewardsQuery } from "interfaces/reward.interface.js";

class RewardService {
  // Create reward
  async create(data: CreateRewardData, imagePath?: string) {
    let image: { url: string; public_id: string } | undefined;

    if (imagePath) {
      const uploaded = await uploadOnCloudinary(imagePath);
      if (!uploaded) {
        throw new ApiError(500, "Failed to upload image");
      }
      image = { url: uploaded.secure_url, public_id: uploaded.public_id };
    }

    const reward = await Reward.create({ ...data, ...(image && { image }) });

    // update cache version and return 
    await cache.incrementVersion(`reward`)
    return reward;
  }

  // Get all rewards
  async getAll(query: GetAllRewardsQuery) {
    const { page = 1, limit = 10, search } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // set the key to cache 
    const version = await cache.getVersion('reward')
    const key = `reward:v${version}:${page}:${limit}:${search??''}`;

    // search the cache and return if hit
    const data = await cache.get(key);
    if (data) return data;

    const filter: Record<string, any> = { isDeleted: false };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { issuer: { $regex: search, $options: "i" } },
      ];
    }

    const [rewards, total] = await Promise.all([
      Reward.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Reward.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const result = {
      rewards,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
    
    // set the result to cache and return 
    await cache.set(key, result, 900)
    return result;
  }

  // Get reward by id
  async getById(id: string) {
    // create key to cache
    const key = `reward:id:${id}`;
    const data = await cache.get(key);
    if (data) return data;

    const reward = await Reward.findOne({ _id: id, isDeleted: false });

    if (!reward) {
      throw new ApiError(404, "Reward not found");
    }

    // set reward to cache and return
    await cache.set(key, reward, 900);
    return reward;
  }

  // Update reward
  async update(id: string, data: Partial<CreateRewardData>, imagePath?: string) {
    const reward = await Reward.findOne({ _id: id, isDeleted: false });

    if (!reward) {
      throw new ApiError(404, "Reward not found");
    }

    let image = reward.image;

    if (imagePath) {
      if (reward.image?.public_id) {
        await deleteFromCloudinary(reward.image.public_id);
      }

      const uploaded = await uploadOnCloudinary(imagePath);
      if (!uploaded) {
        throw new ApiError(500, "Failed to upload image");
      }
      image = { url: uploaded.secure_url, public_id: uploaded.public_id };
    }

    const updated = await Reward.findByIdAndUpdate(
      id,
      { $set: { ...data, image } },
      { returnDocument: "after", runValidators: true }
    );

    // delete the reward key and update reward version
    await Promise.all([
      cache.delete(`reward:id:${id}`),
      cache.incrementVersion('reward')
    ]);
    return updated;
  }

  // Soft delete reward
  async delete(id: string) {
    const reward = await Reward.findOne({ _id: id, isDeleted: false });

    if (!reward) {
      throw new ApiError(404, "Reward not found");
    }

    if (reward.image?.public_id) {
      await deleteFromCloudinary(reward.image.public_id);
    }

    await Reward.findByIdAndUpdate(id, { $set: { isDeleted: true } });

    // delete the reward key and update reward version
    await Promise.all([
      cache.delete(`reward:id:${id}`),
      cache.incrementVersion('reward')
    ]);
    return null;
  }
}

export default new RewardService();
