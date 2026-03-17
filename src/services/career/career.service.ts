import Career from "@models/career.model.js";
import { ApiError } from "@utils/apiError.utils.js";
import cache from "@utils/cache.utils.js";

interface CreateCareerData {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  openings?: number;
  isActive?: boolean;
}

interface GetAllCareersQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

class CareerService {
  // Create career
  async create(data: CreateCareerData) {
    const existing = await Career.findOne({
      title: data.title,
      department: data.department,
      location: data.location,
      type: data.type,
      isDeleted: false,
      isActive: true
    });
    if (existing){
      throw new ApiError(409, "Duplicate career: Career already exists")
    }
    const career = await Career.create(data);

    // update the cache version and return
    await cache.incrementVersion(`career`);
    return career;
  }

  // Get all careers
  async getAll(query: GetAllCareersQuery) {
    const { page = 1, limit = 10, isActive, search } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // create a key to cache the redis
    const version = await cache.getVersion('career')
    const key = `career:v${version}:${page}:${limit}:${isActive??''}:${search??''}`

    //  hit the cache and return if hit
    const data = await cache.get(key);
    if (data) {
      return data;
    }

    const filter: Record<string, any> = { isDeleted: false };

    if (typeof isActive === "boolean") {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const [careers, total] = await Promise.all([
      Career.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Career.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const result = {
      careers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    }

    // set the cache 
    await cache.set(key, result, 600);
    return result;
  }

  // Get career by id
  async getById(id: string) {
    // create a key
    const key = `career:id:${id}`
    
    // hit the cache and return
    const data = await cache.get(key);
    if(data) return data;

    const career = await Career.findOne({ _id: id, isDeleted: false });

    if (!career) {
      throw new ApiError(404, "Career not found");
    }

    // set the data in cache and return
    await cache.set(key, career, 600);
    return career;
  }

  // Get career by slug
  async getBySlug(slug: string) {
    // create a key
    const key = `career:slug:${slug}`
    
    // hit the cache and return
    const data = await cache.get(key);
    if(data) return data;

    const career = await Career.findOne({ slug, isDeleted: false });

    if (!career) {
      throw new ApiError(404, "Career not found");
    }

    // set the data in cache and return
    await cache.set(key, career, 600);
    return career;
  }

  // Update career
  async update(id: string, data: Partial<CreateCareerData>) {
    const career = await Career.findOne({ _id: id, isDeleted: false });

    if (!career) {
      throw new ApiError(404, "Career not found");
    }

    const updated = await Career.findByIdAndUpdate(
      id,
      { $set: data },
      { returnDocument: "after", runValidators: true }
    );

    // delete the cache and update cache version
    await Promise.all([
      cache.delete(`career:id:${id}`),
      cache.delete(`career:slug:${career.slug}`),
      cache.incrementVersion('career')
    ]);
    return updated;
  }

  // Soft delete career
  async delete(id: string) {
    const career = await Career.findOne({ _id: id, isDeleted: false });

    if (!career) {
      throw new ApiError(404, "Career not found");
    }

    await Career.findByIdAndUpdate(id, { $set: { isDeleted: true } });

    // delete the cache and update cache version
    await Promise.all([
      cache.delete(`career:id:${id}`),
      cache.delete(`career:slug:${career.slug}`),
      cache.incrementVersion('career')
    ]);
    return null;
  }

  // Toggle isActive
  async toggleActive(id: string) {
    const career = await Career.findOne({ _id: id, isDeleted: false });

    if (!career) {
      throw new ApiError(404, "Career not found");
    }

    career.isActive = !career.isActive;
    await career.save();

    // delete the cache and update cache version
    await Promise.all([
      cache.delete(`career:id:${id}`),
      cache.delete(`career:slug:${career.slug}`),
      cache.incrementVersion('career')
    ]);
    return career;
  }
}

export default new CareerService();