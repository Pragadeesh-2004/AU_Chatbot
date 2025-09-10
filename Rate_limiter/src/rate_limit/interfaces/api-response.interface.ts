export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  pagination?: {
    current_page: number;
    total_pages: number;
    total: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  info?: any;
  path?: string;
  timestamp?: string;
}