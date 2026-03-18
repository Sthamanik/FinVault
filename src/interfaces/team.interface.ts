export interface CreateTeamData {
  name: string;
  role: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
  };
  isActive?: boolean;
  order?: number;
}

export interface GetAllTeamsQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}