export interface CreateCareerData {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  openings?: number;
  isActive?: boolean;
}

export interface GetAllCareersQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}