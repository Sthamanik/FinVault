import Service from '@models/service.model.js';
import { ApiError } from '@utils/apiError.utils.js';
import {
  uploadToR2,
  deleteFromR2,
} from '@utils/r2.utils.js';
import cache from '@utils/cache.utils.js'
import { CreateServiceData, GetAllServicesQuery } from '@interfaces/services.interface.js';

class ServiceService {
  // Create service
  async create(data: CreateServiceData, imagePath?: string) {
    let image: { url: string; public_id: string } | undefined;

    if (imagePath) {
      const uploaded = await uploadToR2(imagePath);
      if (!uploaded) {
        throw new ApiError(500, 'Failed to upload image to Cloudinary');
      }
      image = { url: uploaded.secure_url, public_id: uploaded.public_id };
    }

    const service = await Service.create({ ...data, ...(image && { image }) });

    // update the cache version and return 
    await cache.incrementVersion('service');
    return service;
  }

  // Get all services with pagination
  async getAll(query: GetAllServicesQuery) {
    const { page = 1, limit = 10, isActive, search } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Create a key to cache
    const version = await cache.getVersion('service');
    const key = `service:v${version}:${page}:${limit}:${isActive??''}:${search??''}`;

    // hit the cache and return if hit 
    const data = await cache.get(key);
    if (data) return data;

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
    const result = {
      services,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    }

    // set the result in cache and return 
    await cache.set(key, result, 900);
    return result;
  }

  // Get single service by ID
  async getById(id: string) {
    // create key to cache
    const key = `service:id:${id}`;
    const data = await cache.get(key);
    if (data) return data;

    const service = await Service.findOne({ _id: id, isDeleted: false });

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    // set the service in cache and return 
    await cache.set(key, service, 900);
    return service;
  }

  // Get single service by slug
  async getBySlug(slug: string) {
    // create key to cache
    const key = `service:slug:${slug}`;
    const data = await cache.get(key);
    if (data) return data;

    const service = await Service.findOne({ slug, isDeleted: false });

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    // set the service in cache and return 
    await cache.set(key, service, 900);
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
        await deleteFromR2(service.image.public_id);
      }

      // Upload new image
      const uploaded = await uploadToR2(imagePath);
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

    // delete the cache and update the version
    await Promise.all([
      cache.delete(`service:id:${id}`),
      cache.delete(`service:slug:${service.slug}`),
      cache.incrementVersion(`service`)
    ]);
    return updated;
  }

  // soft delete the service 
  async delete(id: string) {
    const service = await Service.findOne({ _id: id, isDeleted: false });
    if (!service) throw new ApiError(404, "Service not found");

    await Service.findByIdAndUpdate(id, { $set: { isDeleted: true } });

    await Promise.all([
      cache.delete(`service:id:${id}`),
      cache.delete(`service:slug:${service.slug}`),
      cache.incrementVersion("service"),
    ]);
    return null;
  }

  // restore the service
  async restore(id: string) {
    const service = await Service.findOne({ _id: id, isDeleted: true });
    if (!service) throw new ApiError(404, "Service not found or not deleted");

    await Service.findByIdAndUpdate(id, { $set: { isDeleted: false } });

    await Promise.all([
      cache.delete(`service:id:${id}`),
      cache.delete(`service:slug:${service.slug}`),
      cache.incrementVersion("service"),
    ]);
    return null;
  }

  // hard delete the service
  async hardDelete(id: string) {
    const service = await Service.findOne({ _id: id, isDeleted: true });
    if (!service) throw new ApiError(404, "Service not found or not soft-deleted first");

    if (service.image?.public_id) {
      await deleteFromR2(service.image.public_id);
    }

    await Service.findByIdAndDelete(id);

    await Promise.all([
      cache.delete(`service:id:${id}`),
      cache.delete(`service:slug:${service.slug}`),
      cache.incrementVersion("service"),
    ]);
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

    // delete the cache and update the version
    await Promise.all([
      cache.delete(`service:id:${id}`),
      cache.delete(`service:slug:${service.slug}`),
      cache.incrementVersion(`service`)
    ]);
    return service;
  }
}

export default new ServiceService();
