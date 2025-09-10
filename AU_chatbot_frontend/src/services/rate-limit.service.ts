import { apiClient } from '@/lib/api';
import {
  RateLimit,
  OrganizationRateLimit,
  AssistantRateLimit,
  CreateOrganizationRateLimitDto,
  CreateAssistantRateLimitDto,
  UpdateRateLimitDto,
  RateLimitStats,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
} from '@/types/rate-limit.types';

export class RateLimitService {
  private basePath = '/rate-limits';

  // General rate limits
  async getRateLimits(params: PaginationParams): Promise<PaginatedResponse<RateLimit>> {
    return apiClient.get<PaginatedResponse<RateLimit>>(this.basePath, params);
  }

  async getRateLimit(id: string): Promise<ApiResponse<RateLimit>> {
    return apiClient.get<ApiResponse<RateLimit>>(`${this.basePath}/${id}`);
  }

  async deleteRateLimit(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`${this.basePath}/${id}`);
  }

  // Organization rate limits
  async getOrganizationRateLimits(params: PaginationParams): Promise<PaginatedResponse<OrganizationRateLimit>> {
    return apiClient.get<PaginatedResponse<OrganizationRateLimit>>(`${this.basePath}/organizations`, params);
  }

  async getOrganizationRateLimit(id: string): Promise<ApiResponse<OrganizationRateLimit>> {
    return apiClient.get<ApiResponse<OrganizationRateLimit>>(`${this.basePath}/organizations/${id}`);
  }

  async createOrganizationRateLimit(data: CreateOrganizationRateLimitDto): Promise<ApiResponse<OrganizationRateLimit>> {
    return apiClient.post<ApiResponse<OrganizationRateLimit>>(`${this.basePath}/organizations`, data);
  }

  async updateOrganizationRateLimit(id: string, data: UpdateRateLimitDto): Promise<ApiResponse<OrganizationRateLimit>> {
    return apiClient.patch<ApiResponse<OrganizationRateLimit>>(`${this.basePath}/organizations/${id}`, data);
  }

  async deleteOrganizationRateLimit(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`${this.basePath}/organizations/${id}`);
  }

  // Assistant rate limits
  async getAssistantRateLimits(params: PaginationParams): Promise<PaginatedResponse<AssistantRateLimit>> {
    return apiClient.get<PaginatedResponse<AssistantRateLimit>>(`${this.basePath}/assistants`, params);
  }

  async getAssistantRateLimit(id: string): Promise<ApiResponse<AssistantRateLimit>> {
    return apiClient.get<ApiResponse<AssistantRateLimit>>(`${this.basePath}/assistants/${id}`);
  }

  async createAssistantRateLimit(data: CreateAssistantRateLimitDto): Promise<ApiResponse<AssistantRateLimit>> {
    return apiClient.post<ApiResponse<AssistantRateLimit>>(`${this.basePath}/assistants`, data);
  }

  async updateAssistantRateLimit(id: string, data: UpdateRateLimitDto): Promise<ApiResponse<AssistantRateLimit>> {
    return apiClient.patch<ApiResponse<AssistantRateLimit>>(`${this.basePath}/assistants/${id}`, data);
  }

  async deleteAssistantRateLimit(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`${this.basePath}/assistants/${id}`);
  }

  // Statistics
  async getRateLimitStats(): Promise<ApiResponse<RateLimitStats>> {
    return apiClient.get<ApiResponse<RateLimitStats>>(`${this.basePath}/stats`);
  }
}

export const rateLimitService = new RateLimitService();