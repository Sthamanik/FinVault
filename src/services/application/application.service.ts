import Application from "@models/application.model.js";
import Career from "@models/career.model.js";
import { ApiError } from "@utils/apiError.utils.js";
import {
  deleteFromR2,
  uploadToR2,
} from "@utils/r2.utils.js";
import { CreateApplicationData, GetAllApplicationsQuery } from "@interfaces/application.interface.js";
import { enqueueApplicationNotification, enqueueApplicationStatusNotification } from "@queues/email.queue.js";
import logger from "@utils/logger.utils.js";

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

    const uploadedResume = await uploadToR2(resumePath);
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
      const uploadedCover = await uploadToR2(coverLetterFilePath);
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

    // Enqueue — fire-and-forget
    enqueueApplicationNotification({
      applicantName: application.name,
      applicantEmail: application.email,
      phone: application.phone,
      jobTitle: career.title,   // career is already fetched above in your existing code
      jobId: jobId,
      coverLetter: application.coverLetter,
    }).catch((err) =>
      logger.error(`[application.service] Failed to enqueue email: ${err.message}`)
    );

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

    const oldStatus = application.status;
    const updated = await Application.findByIdAndUpdate(
      id,
      { $set: { status } },
      { returnDocument: "after" }
    );

    // Enqueue
    Career.findById(application.jobId)
      .then((career) => {
        if (!career) return;
        return enqueueApplicationStatusNotification({
          applicantName: application.name,
          applicantEmail: application.email,
          jobTitle: career.title,
          oldStatus,
          newStatus: status,
          applicationId: id,
        });
      })
      .catch((err) =>
        logger.error(`[application.service] Failed to enqueue status email: ${err.message}`)
      );

      return updated;
  }

  // soft delete 
  async delete(id: string) {
    const application = await Application.findOne({ _id: id, isDeleted: false });
    if (!application) throw new ApiError(404, "Application not found");

    await Application.findByIdAndUpdate(id, { $set: { isDeleted: true } });
    return null;
  }

  // restore the soft deleted one
  async restore(id: string) {
    const application = await Application.findOne({ _id: id, isDeleted: true });
    if (!application) throw new ApiError(404, "Application not found or not deleted");

    await Application.findByIdAndUpdate(id, { $set: { isDeleted: false } });
    return null;
  }

  // hard delete — delete resume + cover letter from storage
  async hardDelete(id: string) {
    const application = await Application.findOne({ _id: id, isDeleted: true });
    if (!application) throw new ApiError(404, "Application not found or not soft-deleted first");

    if (application.resume?.public_id) {
      await deleteFromR2(application.resume.public_id);
    }
    if (application.coverLetterFile?.public_id) {
      await deleteFromR2(application.coverLetterFile.public_id);
    }

    await Application.findByIdAndDelete(id);
    return null;
  }
}

export default new ApplicationService();
