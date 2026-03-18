export interface CreateContactData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface GetAllContactsQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}