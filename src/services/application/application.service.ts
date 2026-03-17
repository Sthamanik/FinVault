import Application from "@models/application.model.js";
import Career from "@models/career.model.js";
import { ApiError } from "@utils/apiError.utils.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "@utils/cloudinary.utils.js";

interface CreateApplicationData {
  name: string;
  email: string;
  phone?: string;
  coverLetter?: string;
}

interface GetAllApplicationsQuery {
  page?: number;
  limit?: number;
  status?: string;
  jobId?: string;
  search?: string;
}

class ApplicationService {
  // Create application
  async create(
    jobId: string,
    data: CreateApplicationData,
    resumePath?: string,
    coverLetterFilePath?: string
  ) {
    if (!jobId) {
      throw new ApiError(400, "Job id is required");
    }

    const career = await Career.findOne({ _id: jobId, isDeleted: false });
    if (!career) {
      throw new ApiError(404, "Job not found");
    }

    const existingAppication = await Application.findOne({
      email: data.email, jobId
    })
    if (existingAppication){
      throw new ApiError(409, "Application already exists");
    }

    if (!resumePath) {
      throw new ApiError(400, "Resume file is required");
    }

    const uploadedResume = await uploadOnCloudinary(resumePath);
    if (!uploadedResume) {
      throw new ApiError(500, "Failed to upload resume");
    }

    let coverLetterFile:
      | {
          url: string;
          public_id: string;
        }
      | undefined;

    if (coverLetterFilePath) {
      const uploadedCover = await uploadOnCloudinary(coverLetterFilePath);
      if (!uploadedCover) {
        throw new ApiError(500, "Failed to upload cover letter file");
      }
      coverLetterFile = {
        url: uploadedCover.secure_url,
        public_id: uploadedCover.public_id,
      };
    }

    const application = await Application.create({
      jobId,
      ...data,
      resume: {
        url: uploadedResume.secure_url,
        public_id: uploadedResume.public_id,
      },
      ...(coverLetterFile && { coverLetterFile }),
    });

    return application;
  }

  // Get all applications
  async getAll(query: GetAllApplicationsQuery) {
    const { page = 1, limit = 10, status, jobId, search } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { isDeleted: false };

    if (status) {
      filter.status = status;
    }

    if (jobId) {
      filter.jobId = jobId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Application.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      applications,
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

  // Get application by id
  async getById(id: string) {
    const application = await Application.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    return application;
  }

  // Update application status
  async updateStatus(id: string, status: string) {
    const application = await Application.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    const updated = await Application.findByIdAndUpdate(
      id,
      { $set: { status } },
      { returnDocument: "after" }
    );

    return updated;
  }

  // Soft delete application
  async delete(id: string) {
    const application = await Application.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    if (application.resume?.public_id) {
      await deleteFromCloudinary(application.resume.public_id);
    }

    if (application.coverLetterFile?.public_id) {
      await deleteFromCloudinary(application.coverLetterFile.public_id);
    }

    await Application.findByIdAndUpdate(id, { $set: { isDeleted: true } });

    return null;
  }
}

export default new ApplicationService();
