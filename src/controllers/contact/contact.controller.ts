import { Request, Response } from "express";
import { ApiResponse } from "@utils/apiResponse.utils.js";
import ContactService from "@services/contact/contact.service.js";

class ContactController {
  // Create contact
  async create(req: Request, res: Response) {
    const contact = await ContactService.create(req.body);

    res
      .status(201)
      .json(new ApiResponse(201, contact, "Contact submitted successfully"));
  }

  // Get all contacts
  async getAll(req: Request, res: Response) {
    const { page, limit, status, search } = req.query;

    const result = await ContactService.getAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string | undefined,
      search: search as string | undefined,
    });

    res
      .status(200)
      .json(new ApiResponse(200, result, "Contacts fetched successfully"));
  }

  // Get contact by id
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const contact = await ContactService.getById(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, contact, "Contact fetched successfully"));
  }

  // Update contact status
  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    const contact = await ContactService.updateStatus(id as string, status);

    res
      .status(200)
      .json(new ApiResponse(200, contact, "Contact status updated"));
  }

  // Soft delete contact
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    await ContactService.delete(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Contact deleted successfully"));
  }

  // soft delete contact
  async restore(req: Request, res: Response) {
    const { id } = req.params;

    await ContactService.restore(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Contact restored successfully"));
  }

  // Delete contact
  async hardDelete(req: Request, res: Response) {
    const { id } = req.params;

    await ContactService.hardDelete(id as string);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Contact deleted permanently"));
  }
}

export default new ContactController();
