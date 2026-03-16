import Service from '@models/service.model.js';
import { ApiError } from '@utils/apiError.utils.js';
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '@utils/cloudinary.utils.js';

interface CreateServiceData {
  title: string;
  shortDescription: string;
  longDescription?: string;
  ctaLink?: string;
  investmentFocus?: string;
  industriesPortfolio?: string[];
  isActive?: boolean;
  order?: number;
}

interface GetAllServicesQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

class ServiceService {
  // Create service
  async create(data: CreateServiceData, imagePath?: string) {
    let image: { url: string; public_id: string } | undefined;

    if (imagePath) {
      const uploaded = await uploadOnCloudinary(imagePath);
      if (!uploaded) {
        throw new ApiError(500, 'Failed to upload image to Cloudinary');
      }
      image = { url: uploaded.secure_url, public_id: uploaded.public_id };
    }

    const service = await Service.create({ ...data, ...(image && { image }) });

    return service;
  }

  // Get all services with pagination
  async getAll(query: GetAllServicesQuery) {
    const { page = 1, limit = 10, isActive, search } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { isDeleted: false };

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { investmentFocus: { $regex: search, $options: 'i' } },
      ];
    }

    const [services, total] = await Promise.all([
      Service.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Service.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      services,
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

  // Get single service by ID
  async getById(id: string) {
    const service = await Service.findOne({ _id: id, isDeleted: false });

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    return service;
  }

  // Update service
  async update(id: string, data: Partial<CreateServiceData>, imagePath?: string) {
    const service = await Service.findOne({ _id: id, isDeleted: false });

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    let image = service.image;

    if (imagePath) {
      // Delete old image from Cloudinary if exists
      if (service.image?.public_id) {
        await deleteFromCloudinary(service.image.public_id);
      }

      // Upload new image
      const uploaded = await uploadOnCloudinary(imagePath);
      if (!uploaded) {
        throw new ApiError(500, 'Failed to upload image to Cloudinary');
      }
      image = { url: uploaded.secure_url, public_id: uploaded.public_id };
    }

    const updated = await Service.findByIdAndUpdate(
      id,
      { $set: { ...data, image } },
      { returnDocument: "after", runValidators: true }
    );

    return updated;
  }

  // Soft delete service
  async delete(id: string) {
    const service = await Service.findOne({ _id: id, isDeleted: false });

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    // Delete image from Cloudinary if exists
    if (service.image?.public_id) {
      await deleteFromCloudinary(service.image.public_id);
    }

    await Service.findByIdAndUpdate(id, { $set: { isDeleted: true } });

    return null;
  }

  // Toggle isActive
  async toggleActive(id: string) {
    const service = await Service.findOne({ _id: id, isDeleted: false });

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    service.isActive = !service.isActive;
    await service.save();

    return service;
  }
}

export default new ServiceService();
