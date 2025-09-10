export interface RateLimit {
  _id: string;
  name: string;
  description?: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationRateLimit extends RateLimit {
  organizationId: string;
  organizationName: string;
}

export interface AssistantRateLimit extends RateLimit {
  assistantId: string;
  assistantName: string;
}

export interface CreateRateLimitDto {
  name: string;
  description?: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  isActive: boolean;
}

export interface CreateOrganizationRateLimitDto extends CreateRateLimitDto {
  organizationId: string;
}

export interface CreateAssistantRateLimitDto extends CreateRateLimitDto {
  assistantId: string;
}

export interface UpdateRateLimitDto extends Partial<CreateRateLimitDto> {}

export interface RateLimitStats {
  totalRateLimits: number;
  activeRateLimits: number;
  inactiveRateLimits: number;
  organizationLimits: number;
  assistantLimits: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}