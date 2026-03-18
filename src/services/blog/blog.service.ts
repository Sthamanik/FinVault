import Blog from "@models/blog.model.js";
import { ApiError } from "@utils/apiError.utils.js";
import cache from "@utils/cache.utils.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "@utils/cloudinary.utils.js";
import { CreateBlogData, GetAllBlogsQuery } from "interfaces/blog.interface.js";

class BlogService {
  private async existingBlogTitleForCategory(
    title: string,
    category: string,
    excludeId?: string
  ): Promise<boolean> {
      const query: Record<string, any> = { title, category, isDeleted: false };
      if (excludeId) {
          query._id = { $ne: excludeId };
      }
      const blog = await Blog.findOne(query);
      return blog !== null;
  }

  // Create blog
  async create(data: CreateBlogData, imagePath?: string) {
    let featuredImage: { url: string; public_id: string } | undefined;
    
    if (data.category) {
      const exists = await this.existingBlogTitleForCategory(data.title, data.category);
      if (exists) {
          throw new ApiError(409, `Blog with same title already exists in category: ${data.category}`);
      }
    }

    if (imagePath) {
      const uploaded = await uploadOnCloudinary(imagePath);
      if (!uploaded) {
        throw new ApiError(500, "Failed to upload featured image");
      }
      featuredImage = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    const blog = await Blog.create({
      ...data,
      ...(featuredImage && { featuredImage }),
    });

    // update the cache version and return
    await cache.incrementVersion('blog');
    return blog;
  }

  // Get all blogs
  async getAll(query: GetAllBlogsQuery) {
    const { page = 1, limit = 10, status, category, tag, search } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // create a key to cache the redis
    const version = await cache.getVersion('blog')
    const key = `blog:v${version}:${page}:${limit}:${status??''}:${category??''}:${tag??''}:${search??''}`

    //  hit the cache and return
    const data = await cache.get(key);
    if (data) {
      return data;
    }

    const filter: Record<string, any> = { isDeleted: false };

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const result = {
      blogs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      }
    };
    
    // set the cache and return
    await cache.set(key, result, 600);
    return result;
  }

  // Get blog by id
  async getById(id: string) {
    // create a key to cache the db
    const key = `blog:id:${id}`;

    // if cache hit return the data
    const data = await cache.get(key);
    if (data) {
      return data
    }

    const blog = await Blog.findOne({ _id: id, isDeleted: false });

    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    // set the cache and return
    await cache.set(key, blog, 600);
    return blog;
  }

  // Get blog by slug
  async getBySlug(slug: string) {
    // create a key to cache the db
    const key = `blog:slug:${slug}`;

    // if cache hit return the data
    const data = await cache.get(key);
    if (data) {
      return data
    }

    const blog = await Blog.findOne({ slug, isDeleted: false });

    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    // set the cache and return
    await cache.set(key, blog, 600);
    return blog;
  }

  // Update blog
  async update(id: string, data: Partial<CreateBlogData>, imagePath?: string) {
    const blog = await Blog.findOne({ _id: id, isDeleted: false });

    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    const checkTitle = data.title ?? blog.title;
    const checkCategory = data.category ?? blog.category;

    if (checkTitle && checkCategory) {
        const exists = await this.existingBlogTitleForCategory(checkTitle, checkCategory as string, id);
        if (exists) {
            throw new ApiError(409, `Blog with same title already exists in category: ${checkCategory}`);
        }
    }

    let featuredImage = blog.featuredImage;

    if (imagePath) {
      if (blog.featuredImage?.public_id) {
        await deleteFromCloudinary(blog.featuredImage.public_id);
      }

      const uploaded = await uploadOnCloudinary(imagePath);
      if (!uploaded) {
        throw new ApiError(500, "Failed to upload featured image");
      }
      featuredImage = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    Object.assign(blog, data);
    const updated = await blog.save();

    // delete the cache and update cache version
    await Promise.all([
      cache.delete(`blog:id:${id}`),
      cache.delete(`blog:slug:${blog.slug}`),
      cache.incrementVersion('blog')
    ]);

    return updated;
  }

  // Soft delete blog
  async delete(id: string) {
    const blog = await Blog.findOne({ _id: id, isDeleted: false });

    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    if (blog.featuredImage?.public_id) {
      await deleteFromCloudinary(blog.featuredImage.public_id);
    }

    await Blog.findByIdAndUpdate(id, { $set: { isDeleted: true } });

    // delete the cache and update cache version
    await Promise.all([
      cache.delete(`blog:id:${id}`),
      cache.delete(`blog:slug:${blog.slug}`),
      cache.incrementVersion('blog')
    ]);

    return null;
  }
}

export default new BlogService();
