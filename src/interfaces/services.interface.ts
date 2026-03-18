export interface CreateServiceData {
  title: string;
  shortDescription: string;
  longDescription?: string;
  ctaLink?: string;
  investmentFocus?: string;
  industriesPortfolio?: string[];
  isActive?: boolean;
  order?: number;
}

export interface GetAllServicesQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}