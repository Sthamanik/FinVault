import Contact from "@models/contact.model.js";
import { ApiError } from "@utils/apiError.utils.js";
import { 
  CreateContactData, GetAllContactsQuery 
} from "@interfaces/contact.interface.js";
import logger from "@utils/logger.utils.js";
import { enqueueContactNotification } from "@queues/email.queue.js";

class ContactService {
  // Create contact
  async create(data: CreateContactData) {
    const contact = await Contact.create(data);

    // Fire-and-forget 
    enqueueContactNotification({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
    }).catch((err) =>
      logger.error(`[contact.service] Failed to enqueue email: ${err.message}`)
    );
    return contact;
  }

  // Get all contacts
  async getAll(query: GetAllContactsQuery) {
    const { page = 1, limit = 10, status, search } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { isDeleted: false };

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Contact.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      contacts,
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

  // Get contact by id
  async getById(id: string) {
    const contact = await Contact.findOne({ _id: id, isDeleted: false });

    if (!contact) {
      throw new ApiError(404, "Contact not found");
    }

    return contact;
  }

  // Update contact status
  async updateStatus(id: string, status: string) {
    const contact = await Contact.findOne({ _id: id, isDeleted: false });

    if (!contact) {
      throw new ApiError(404, "Contact not found");
    }

    const updated = await Contact.findByIdAndUpdate(
      id,
      { $set: { status } },
      { returnDocument: "after" }
    );

    return updated;
  }

  // Soft delete contact
  async delete(id: string) {
    const contact = await Contact.findOne({ _id: id, isDeleted: false });

    if (!contact) {
      throw new ApiError(404, "Contact not found");
    }

    await Contact.findByIdAndUpdate(id, { $set: { isDeleted: true } });

    return null;
  }

  // Restore
  async restore(id: string) {
    const contact = await Contact.findOne({ _id: id, isDeleted: true });
    if (!contact) {
      throw new ApiError(404, "Contact not found or not deleted");
    }

    await Contact.findByIdAndUpdate(id, { $set: { isDeleted: false } });
    return null;
  }

  // Hard delete
  async hardDelete(id: string) {
    const contact = await Contact.findOne({ _id: id, isDeleted: true });
    if (!contact) {
      throw new ApiError(404, "Contact not found or not soft-deleted first");
    }

    await Contact.findByIdAndDelete(id);
    return null;
  }
}

export default new ContactService();
