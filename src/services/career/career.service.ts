import Career from "@models/career.model.js";
import { ApiError } from "@utils/apiError.utils.js";

interface CreateCareerData {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
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
    const career = await Career.create(data);
    return career;
  }

  // Get all careers
  async getAll(query: GetAllCareersQuery) {
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

    return {
      careers,
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

  // Get career by id
  async getById(id: string) {
    const career = await Career.findOne({ _id: id, isDeleted: false });

    if (!career) {
      throw new ApiError(404, "Career not found");
    }

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

    return updated;
  }

  // Soft delete career
  async delete(id: string) {
    const career = await Career.findOne({ _id: id, isDeleted: false });

    if (!career) {
      throw new ApiError(404, "Career not found");
    }

    await Career.findByIdAndUpdate(id, { $set: { isDeleted: true } });

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

    return career;
  }
}

export default new CareerService();
