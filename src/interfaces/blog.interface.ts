export interface CreateBlogData {
  title: string;
  content: string;
  author?: string;
  tags?: string[];
  category?: string;
  status?: "draft" | "published";
  metaTitle?: string;
  metaDescription?: string;
}

export interface GetAllBlogsQuery {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  tag?: string;
  search?: string;
}