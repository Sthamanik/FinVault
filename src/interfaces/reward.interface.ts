export interface CreateRewardData {
  title: string;
  issuer: string;
  description?: string;
  credentialUrl?: string;
  issueDate?: Date;
}

export interface GetAllRewardsQuery {
  page?: number;
  limit?: number;
  search?: string;
}