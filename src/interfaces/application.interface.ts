export interface CreateApplicationData {
  name: string;
  email: string;
  phone?: string;
  coverLetter?: string;
}

export interface GetAllApplicationsQuery {
  page?: number;
  limit?: number;
  status?: string;
  jobId?: string;
  search?: string;
}