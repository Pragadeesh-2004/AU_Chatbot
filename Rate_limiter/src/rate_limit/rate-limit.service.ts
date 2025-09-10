import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  PreconditionFailedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RateLimit, RateLimitDocument } from './schemas/rate_limits.schema';
import { Organisation, OrganisationDocument } from '../organisation/schema/organisation.schema';
import { Assistant, AssistantDocument } from 'src/assistants/schema/assistants.schema';
import { CreateRateLimitDto } from './dto/create-rate-limit.dto';
import { UpdateRateLimitDto } from './dto/update-rate-limit.dto';
import { CreateAssistantLimitDto } from './dto/create-assistant-limit.dto';
import { UpdateAssistantLimitDto } from './dto/update-assistant-limit.dto';
import { ApiResponse } from './interfaces/api-response.interface';
import { PaginationService } from '../common/services/pagination.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterOrgRateLimitsDto } from '../common/dto/filter-org-rate-limits.dto';
// import { ReplaceRateLimitDto } from './dto/replace-rate-limit.dto';
// import { ReplaceAssistantLimitDto } from './dto/replace-assistant-limit.dto';

@Injectable()
export class RateLimitService {
  constructor(
    @InjectModel(RateLimit.name)
    private readonly rateLimitModel: Model<RateLimitDocument>,
    @InjectModel('Organisation')
    private readonly organisationModel: Model<OrganisationDocument>,
    @InjectModel('Assistant')
    private readonly assistantModel: Model<AssistantDocument>,
    private readonly paginationService: PaginationService,
    @InjectModel('ratelimit_logs') private readonly rateLimitLogsModel: Model<any>,
  ) {}

  private createSuccessResponse<T>(
    data: T, 
    message?: string, 
    pagination?: any, 
    info?: any
  ): ApiResponse<T> {
    const response: ApiResponse<T> = {
      data,
      status: 'success',
      ...(message && { message })
    };

    if (pagination) {
      response.pagination = pagination;
    }

    if (info) {
      response.info = info;
    }

    return response;
  }

  private createBudgetExhaustedResponse(violations: string[], remainingBudget: any): any {
    return {
      error: 'Budget Exhausted',
      message: 'The requested allocation exceeds available budget.',
      violations: violations,
      available_budget: {
        input_tokens: remainingBudget.max_input_token,
        output_tokens: remainingBudget.max_output_token,
        file_count: remainingBudget.file_count,
        file_size: remainingBudget.file_size,
        knowledge_base_index_size: remainingBudget.knowledge_base_index_size,
      },
      status_code: 412,
      timestamp: new Date().toISOString(),
    };
  }

  async validateOrganizationExists(organizationId: string): Promise<void> {
    const organizationExists = await this.organisationModel.findById(organizationId).select('_id');
    if (!organizationExists) {
      throw new NotFoundException(`Organisation with ID ${organizationId} does not exist.`);
    }
  }

  async validateAssistantExists(assistantId: string): Promise<void> {
    const assistantExists = await this.assistantModel.findById(assistantId).select('_id');
    if (!assistantExists) {
      throw new NotFoundException(`Assistant with ID ${assistantId} does not exist.`);
    }
  }

  async validateAssistantBelongsToOrganization(organizationId: string, assistantId: string): Promise<void> {
    await this.validateOrganizationExists(organizationId);

    const assistantBelongsToOrg = await this.assistantModel.findOne({
      _id: new Types.ObjectId(assistantId),
      org_id: new Types.ObjectId(organizationId),
    }).select('_id');

    if (!assistantBelongsToOrg) {
      throw new NotFoundException(`Assistant with ID ${assistantId} does not belong to organisation ${organizationId} or does not exist.`);
    }
  }

  private validateDuplicateAssistantIds(assistantIds: string[]): void {
    const uniqueAssistantIds = new Set(assistantIds);
    if (assistantIds.length !== uniqueAssistantIds.size) {
      throw new BadRequestException('Duplicate assistant IDs found in the request.');
    }
  }

  async validateMultipleAssistantsBelongToOrganization(organizationId: string, assistantIds: string[]): Promise<void> {
    await this.validateOrganizationExists(organizationId);
    
    const validAssistants = await this.assistantModel.find({
      _id: { $in: assistantIds.map(id => new Types.ObjectId(id)) },
      org_id: new Types.ObjectId(organizationId),
    }).select('_id').lean();

    const validAssistantIds = validAssistants.map(a => a._id.toString());
    const invalidAssistants = assistantIds.filter(id => !validAssistantIds.includes(id));

    if (invalidAssistants.length > 0) {
      throw new NotFoundException(
        `The following assistants do not belong to organisation ${organizationId} or do not exist: ${invalidAssistants.join(', ')}`
      );
    }
  }

  private validateBudgetAllocation(requestedLimits: any, remainingBudget: any): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];
    
    const resourceChecks = [
      { field: 'input_token_per_assistant', orgField: 'max_input_token', label: 'Input tokens per assistant' },
      { field: 'output_token_per_assistant', orgField: 'max_output_token', label: 'Output tokens per assistant' },
      { field: 'file_count', orgField: 'file_count', label: 'File count' },
      { field: 'file_size', orgField: 'file_size', label: 'File size' },
      { field: 'knowledge_base_index_size', orgField: 'knowledge_base_index_size', label: 'Knowledge base index size' },
    ];

    resourceChecks.forEach(({ field, orgField, label }) => {
      const requestedAmount = requestedLimits[field] || 0;
      const availableAmount = remainingBudget[orgField] || 0;
      
      if (requestedAmount > availableAmount) {
        violations.push(
          `${label}: requested ${requestedAmount} exceeds available budget ${availableAmount}. Please set a value ≤ ${availableAmount}.`
        );
      }
    });

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  private validateUserLimitsAgainstAssistantLimits(assistantLimits: any): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];
    
    if (assistantLimits.input_token_per_user > assistantLimits.input_token_per_assistant) {
      violations.push(
        `Input tokens per user (${assistantLimits.input_token_per_user}) cannot exceed input tokens per assistant (${assistantLimits.input_token_per_assistant}). Please set a value ≤ ${assistantLimits.input_token_per_assistant}.`
      );
    }

    if (assistantLimits.output_token_per_user > assistantLimits.output_token_per_assistant) {
      violations.push(
        `Output tokens per user (${assistantLimits.output_token_per_user}) cannot exceed output tokens per assistant (${assistantLimits.output_token_per_assistant}). Please set a value ≤ ${assistantLimits.output_token_per_assistant}.`
      );
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  async checkOrganizationRateLimitExists(organizationId: string): Promise<boolean> {
    const rateLimitExists = await this.rateLimitModel.findOne({ 
      org_id: new Types.ObjectId(organizationId) 
    }).select('_id');
    return !!rateLimitExists;
  }

  async checkAssistantRateLimitExists(organizationId: string, assistantId: string): Promise<boolean> {
    const organizationRateLimit = await this.rateLimitModel.findOne({ 
      org_id: new Types.ObjectId(organizationId) 
    }).select('assistants');
    
    if (!organizationRateLimit || !organizationRateLimit.assistants) {
      return false;
    }

    return organizationRateLimit.assistants.some(
      (assistant) => assistant.assistant_id.toString() === assistantId
    );
  }

  private getTotalAllocatedByAssistants(assistants: any[]): any {
    return assistants.reduce((total, assistant) => ({
      input_token_per_assistant: total.input_token_per_assistant + (assistant.input_token_per_assistant || 0),
      output_token_per_assistant: total.output_token_per_assistant + (assistant.output_token_per_assistant || 0),
      file_count: total.file_count + (assistant.file_count || 0),
      file_size: total.file_size + (assistant.file_size || 0),
      knowledge_base_index_size: total.knowledge_base_index_size + (assistant.knowledge_base_index_size || 0),
    }), {
      input_token_per_assistant: 0,
      output_token_per_assistant: 0,
      file_count: 0,
      file_size: 0,
      knowledge_base_index_size: 0,
    });
  }

  private getRemainingOrganizationBudget(organizationLimits: any, totalAllocated: any): any {
    return {
      max_input_token: Math.max(0, (organizationLimits.max_input_token || 0) - totalAllocated.input_token_per_assistant),
      max_output_token: Math.max(0, (organizationLimits.max_output_token || 0) - totalAllocated.output_token_per_assistant),
      file_count: Math.max(0, (organizationLimits.file_count || 0) - totalAllocated.file_count),
      file_size: Math.max(0, (organizationLimits.file_size || 0) - totalAllocated.file_size),
      knowledge_base_index_size: Math.max(0, (organizationLimits.knowledge_base_index_size || 0) - totalAllocated.knowledge_base_index_size),
    };
  }

  private getMaxConcurrentUsers(assistantLimits: any): any {
    const maxInputUsers = assistantLimits.input_token_per_user > 0 
      ? Math.floor(assistantLimits.input_token_per_assistant / assistantLimits.input_token_per_user)
      : 0;

    const maxOutputUsers = assistantLimits.output_token_per_user > 0
      ? Math.floor(assistantLimits.output_token_per_assistant / assistantLimits.output_token_per_user)  
      : 0;

    const effectiveMaxUsers = Math.min(maxInputUsers, maxOutputUsers);

    return {
      max_input_users: maxInputUsers,
      max_output_users: maxOutputUsers,
      effective_max_users: effectiveMaxUsers,
    };
  }

  private getOrganizationBudgetSummary(organization: any): any {
    const assistants = organization.assistants || [];
    const totalAllocated = this.getTotalAllocatedByAssistants(assistants);
    const remainingBudget = this.getRemainingOrganizationBudget(organization, totalAllocated);
    
    return {
      organization_limits: {
        max_input_token: organization.max_input_token || 0,
        max_output_token: organization.max_output_token || 0,
        file_count: organization.file_count || 0,
        file_size: organization.file_size || 0,
        knowledge_base_index_size: organization.knowledge_base_index_size || 0,
        active_assistant_count: organization.active_assistant_count || 0,
      },
      total_allocated: totalAllocated,
      remaining_budget: remainingBudget,
    };
  }

  private buildMongoFilter(filterDto: FilterOrgRateLimitsDto): Record<string, any> {
    const filter: Record<string, any> = {};
    
    const allowedFields = [
      'max_input_token',
      'max_output_token', 
      'file_count',
      'file_size',
      'knowledge_base_count',
      'knowledge_base_index_size',
      'active_assistant_count'
    ];

    const filterParams = { ...filterDto };
    
    Object.keys(filterParams).forEach(key => {
      if (!allowedFields.includes(key)) return;
      
      const value = filterParams[key];
      if (value === null || value === undefined) return;
      
      if (typeof value === 'object' && value !== null) {
        const mongoQuery: Record<string, any> = {};
        
        const supportedOperators = ['gte', 'gt', 'lte', 'lt', 'ne', 'eq', 'in', 'nin'];
        
        Object.keys(value).forEach(operator => {
          if (supportedOperators.includes(operator)) {
            mongoQuery[`$${operator}`] = Number(value[operator]);
          }
        });
        
        if (Object.keys(mongoQuery).length > 0) {
          filter[key] = mongoQuery;
        }
      } 
      else {
        if (typeof value === 'number') {
          filter[key] = value;
        } else if (!isNaN(Number(value))) {
          filter[key] = Number(value);
        }
      }
    });

    return filter;
  }

  private filterAssistantsByParams(assistants: any[], filterDto: FilterOrgRateLimitsDto): any[] {
    const filterParams = { ...filterDto };
    
    if (Object.keys(filterParams).length === 0) return assistants;

    const allowedAssistantFields = [
      'input_token_per_user',
      'input_token_per_assistant', 
      'output_token_per_user',
      'output_token_per_assistant',
      'file_count',
      'file_size',
      'knowledge_base_index_size'
    ];

    return assistants.filter(assistant => {
      return Object.entries(filterParams).every(([key, value]) => {
        if (!allowedAssistantFields.includes(key)) return true;
        
        if (value === null || value === undefined || value === '') return true;
        
        const assistantValue = Number(assistant[key]) || 0;
        
        if (typeof value === 'object' && value !== null) {
          return Object.entries(value).every(([operator, operatorValue]) => {
            const numericValue = Number(operatorValue);
            if (isNaN(numericValue)) return true;
            
            switch (operator) {
              case 'gte': return assistantValue >= numericValue;
              case 'gt': return assistantValue > numericValue;
              case 'lte': return assistantValue <= numericValue;
              case 'lt': return assistantValue < numericValue;
              case 'ne': return assistantValue !== numericValue;
              case 'eq': return assistantValue === numericValue;
              case 'in': return Array.isArray(operatorValue) && operatorValue.includes(assistantValue);
              case 'nin': return Array.isArray(operatorValue) && !operatorValue.includes(assistantValue);
              default: return true;
            }
          });
        }
        
        const filterValue = Number(value);
        if (isNaN(filterValue)) return true;
        
        return assistantValue === filterValue;
      });
    });
  }


  private prepareRateLimitData(dto: CreateRateLimitDto): { data: any; defaultedFields: string[] } {
    const defaultedFields: string[] = [];
    
    const data = {
      org_id: new Types.ObjectId(dto.org_id),
      max_input_token: dto.max_input_token || 0,
      max_output_token: dto.max_output_token || 0,
      file_count: dto.file_count || 0,
      file_size: dto.file_size || 0,
      knowledge_base_count: dto.knowledge_base_count || 0,
      knowledge_base_index_size: dto.knowledge_base_index_size || 0,
      active_assistant_count: dto.active_assistant_count || 0,
      assistants: dto.assistants?.map(assistant => this.prepareAssistantData(assistant)) || [],
    };

    if (!dto.max_input_token) defaultedFields.push('max_input_token');
    if (!dto.max_output_token) defaultedFields.push('max_output_token');
    if (!dto.file_count) defaultedFields.push('file_count');
    if (!dto.file_size) defaultedFields.push('file_size');
    if (!dto.knowledge_base_count) defaultedFields.push('knowledge_base_count');
    if (!dto.knowledge_base_index_size) defaultedFields.push('knowledge_base_index_size');
    if (!dto.active_assistant_count) defaultedFields.push('active_assistant_count');
    if (!dto.assistants || dto.assistants.length === 0) defaultedFields.push('assistants');

    return { data, defaultedFields };
  }

  private prepareAssistantData(assistant: any): any {
    return {
      ...assistant,
      assistant_id: new Types.ObjectId(assistant.assistant_id),
      input_token_per_user: assistant.input_token_per_user || 0,
      input_token_per_assistant: assistant.input_token_per_assistant || 0,
      output_token_per_user: assistant.output_token_per_user || 0,
      output_token_per_assistant: assistant.output_token_per_assistant || 0,
      file_count: assistant.file_count || 0,
      file_size: assistant.file_size || 0,
      knowledge_base_index_size: assistant.knowledge_base_index_size || 0,
    };
  }

  private prepareUpdateData(dto: UpdateRateLimitDto): any {
    const updateData: any = { ...dto };

    if (dto.org_id) {
      updateData.org_id = new Types.ObjectId(dto.org_id);
    }

    if (dto.assistants) {
      updateData.assistants = dto.assistants.map(assistant => ({
        ...assistant,
        assistant_id: new Types.ObjectId(assistant.assistant_id!)
      }));
    }

    return updateData;
  }

  private prepareRequestedLimits(dto: any): { limits: any; defaultedFields: string[] } {
    const defaultedFields: string[] = [];
    
    const limits = {
      input_token_per_assistant: dto.input_token_per_assistant || 0,
      output_token_per_assistant: dto.output_token_per_assistant || 0,
      input_token_per_user: dto.input_token_per_user || 0,
      output_token_per_user: dto.output_token_per_user || 0,
      file_count: dto.file_count || 0,
      file_size: dto.file_size || 0,
      knowledge_base_index_size: dto.knowledge_base_index_size || 0,
    };

    if (!dto.input_token_per_assistant) defaultedFields.push('input_token_per_assistant');
    if (!dto.output_token_per_assistant) defaultedFields.push('output_token_per_assistant');
    if (!dto.input_token_per_user) defaultedFields.push('input_token_per_user');
    if (!dto.output_token_per_user) defaultedFields.push('output_token_per_user');
    if (!dto.file_count) defaultedFields.push('file_count');
    if (!dto.file_size) defaultedFields.push('file_size');
    if (!dto.knowledge_base_index_size) defaultedFields.push('knowledge_base_index_size');

    return { limits, defaultedFields };
  }

  private prepareUpdatedLimits(dto: UpdateAssistantLimitDto, currentAssistant: any): any {
    return {
      input_token_per_assistant: dto.input_token_per_assistant ?? currentAssistant.input_token_per_assistant,
      output_token_per_assistant: dto.output_token_per_assistant ?? currentAssistant.output_token_per_assistant,
      input_token_per_user: dto.input_token_per_user ?? currentAssistant.input_token_per_user,
      output_token_per_user: dto.output_token_per_user ?? currentAssistant.output_token_per_user,
      file_count: dto.file_count ?? currentAssistant.file_count,
      file_size: dto.file_size ?? currentAssistant.file_size,
      knowledge_base_index_size: dto.knowledge_base_index_size ?? currentAssistant.knowledge_base_index_size,
    };
  }

  private validateCompleteOrganizationRequest(dto: CreateRateLimitDto): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];
    
    if (!dto.assistants || dto.assistants.length === 0) {
      return { isValid: true, violations: [] }; // No assistants to validate
    }

    // 1. Validate user limits ≤ assistant limits for each assistant
    dto.assistants.forEach((assistant, index) => {
      const userValidation = this.validateUserLimitsAgainstAssistantLimits(assistant);
      if (!userValidation.isValid) {
        violations.push(...userValidation.violations.map(v => `Assistant ${index + 1} (${assistant.assistant_id}): ${v}`));
      }
    });

    // 2. 🚀 MAIN VALIDATION: SUM of all assistant limits ≤ organization limits
    const totalAllocationViolations = this.validateTotalAllocationAgainstOrgLimits(dto.assistants, dto);
    violations.push(...totalAllocationViolations);

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  private validateTotalAllocationAgainstOrgLimits(assistants: any[], orgLimits: any): string[] {
    const violations: string[] = [];
    
    // Calculate TOTAL allocation across ALL assistants
    const totalAllocated = this.getTotalAllocatedByAssistants(assistants);
    
    const checks = [
      { 
        assistantField: 'input_token_per_assistant', 
        orgField: 'max_input_token', 
        label: 'Total input tokens allocation' 
      },
      { 
        assistantField: 'output_token_per_assistant', 
        orgField: 'max_output_token', 
        label: 'Total output tokens allocation' 
      },
      { 
        assistantField: 'file_count', 
        orgField: 'file_count', 
        label: 'Total file count allocation' 
      },
      { 
        assistantField: 'file_size', 
        orgField: 'file_size', 
        label: 'Total file size allocation' 
      },
      { 
        assistantField: 'knowledge_base_index_size', 
        orgField: 'knowledge_base_index_size', 
        label: 'Total knowledge base index size allocation' 
      }
    ];

    checks.forEach(({ assistantField, orgField, label }) => {
      const totalValue = totalAllocated[assistantField] || 0;
      const orgValue = orgLimits[orgField] || 0;
      
      if (totalValue > orgValue) {
        violations.push(
          `${label} (${totalValue}) exceeds organization limit (${orgValue}). Reduce total allocation by ${totalValue - orgValue}.`
        );
      }
    });

    return violations;
  }

  async createOrganizationRateLimit(dto: CreateRateLimitDto): Promise<ApiResponse> {
    try {
      await this.validateOrganizationExists(dto.org_id);

      const rateLimitExists = await this.checkOrganizationRateLimitExists(dto.org_id);
      if (rateLimitExists) {
        throw new ConflictException(`Rate limit already exists for organisation ${dto.org_id}.`);
      }

      if (dto.assistants && dto.assistants.length > 0) {
        const assistantIds = dto.assistants.map(a => a.assistant_id);
        this.validateDuplicateAssistantIds(assistantIds);
        await this.validateMultipleAssistantsBelongToOrganization(dto.org_id, assistantIds);

        // 🚀 NEW ENHANCED VALIDATION
        const validation = this.validateCompleteOrganizationRequest(dto);
        if (!validation.isValid) {
          throw new BadRequestException(
            `Organization creation validation failed: ${validation.violations.join('; ')}`
          );
        }
      }

      const { data: rateLimitData, defaultedFields } = this.prepareRateLimitData(dto);
      const result = await this.rateLimitModel.create(rateLimitData);
      
      const info = defaultedFields.length > 0 ? {
        defaulted_fields: defaultedFields,
        default_value: 0,
        message: `${defaultedFields.length} field(s) were set to default value (0) because they were not provided`
      } : undefined;
      
      return this.createSuccessResponse(
        result, 
        `Organization rate limit created successfully for ${dto.org_id}.`,
        undefined,
        info
      );
    } catch (error) {
      if (error instanceof ConflictException || 
          error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create organization rate limit: ${error.message}`);
    }
  }

  async getOrganizationRateLimits(
  page: number = 1,
  limit: number = 10,
  filter: any = {}
): Promise<ApiResponse> {
  try {
    const paginationDto: PaginationDto = { page, limit };
    const filterDto: FilterOrgRateLimitsDto = { ...filter };
    
    const mongoFilter = this.buildMongoFilter(filterDto);
    const result = await this.paginationService.paginate(
      this.rateLimitModel,
      { page, limit },
      mongoFilter
    );

    if (page > result.pagination.total_pages && result.pagination.total_pages > 0) {
      throw new NotFoundException(
        `Page ${page} does not exist. Total pages available: ${result.pagination.total_pages}`
      );
    }

    const message =
      result.data.length === 0
        ? 'No organization rate limits found.'
        : `Found ${result.pagination.total} result(s).`;

    return this.createSuccessResponse(result.data, message, result.pagination);
  } catch (error) {
    if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
    throw new BadRequestException(
      `Failed to retrieve organization rate limits: ${error.message}`
    );
  }
}


  async getOrganizationRateLimit(organizationId: string): Promise<ApiResponse> {
    try {
      await this.validateOrganizationExists(organizationId);
      
      const organization = await this.rateLimitModel.findOne({ 
        org_id: new Types.ObjectId(organizationId) 
      }).lean();
      
      if (!organization) {
        throw new NotFoundException(`No rate limit found for organisation ${organizationId}.`);
      }
      
      const budgetSummary = this.getOrganizationBudgetSummary(organization);
      const responseData = {
        ...organization,
        budget_summary: budgetSummary,
      };
      
      return this.createSuccessResponse(responseData, `Organization rate limit retrieved successfully for ${organizationId}.`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to retrieve organization rate limit: ${error.message}`);
    }
  }

  
  async deleteOrganizationRateLimit(organizationId: string): Promise<ApiResponse> {
    try {
      await this.validateOrganizationExists(organizationId);

      const deletedOrganization = await this.rateLimitModel.findOneAndDelete({ 
        org_id: new Types.ObjectId(organizationId) 
      });

      if (!deletedOrganization) {
        throw new NotFoundException(`No rate limit found for organisation ${organizationId}.`);
      }

      return this.createSuccessResponse(deletedOrganization, `Organisation rate limit for ${organizationId} deleted successfully.`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete organization rate limit: ${error.message}`);
    }
  }

  async getAssistantRateLimits(
  organizationId: string,
  page: number = 1,
  limit: number = 10,
  filter: any = {}
): Promise<ApiResponse> {
  try {
    await this.validateOrganizationExists(organizationId);

    const organizationRateLimitExists = await this.checkOrganizationRateLimitExists(organizationId);
    if (!organizationRateLimitExists) {
      throw new NotFoundException(`No rate limit found for organisation ${organizationId}.`);
    }

    const organization = await this.rateLimitModel.findOne({ 
      org_id: new Types.ObjectId(organizationId) 
    }).select('assistants').lean();

    const allAssistants = organization?.assistants || [];

    // Parse filter from request
    const filterDto: FilterOrgRateLimitsDto =
      typeof filter === 'string' ? JSON.parse(filter) : filter;

    // Filter assistants using existing helper
    const filteredAssistants = this.filterAssistantsByParams(allAssistants, filterDto);

    // Pagination
    const totalPages = Math.ceil(filteredAssistants.length / limit);
    if (page > totalPages && totalPages > 0) {
      throw new NotFoundException(
        `Page ${page} does not exist. Total pages available: ${totalPages}`
      );
    }

    const skip = this.paginationService.calculateSkip(page, limit);
    const paginatedAssistants = filteredAssistants.slice(skip, skip + limit);
    const pagination = this.paginationService.createPaginationMeta(
      filteredAssistants.length,
      page,
      limit
    );

    const message = filteredAssistants.length === 0
      ? `No assistants found for organization ${organizationId}.`
      : `Found ${filteredAssistants.length} assistant(s) for organization ${organizationId}.`;

    return this.createSuccessResponse(paginatedAssistants, message, pagination);

  } catch (error) {
    if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
    throw new BadRequestException(`Failed to retrieve assistants: ${error.message}`);
  }
}


  async getAssistantRateLimit(organizationId: string, assistantId: string, filter: any = {}): Promise<ApiResponse> {
    try {
      await this.validateAssistantBelongsToOrganization(organizationId, assistantId);
      
      const organizationRateLimitExists = await this.checkOrganizationRateLimitExists(organizationId);
      if (!organizationRateLimitExists) {
        throw new NotFoundException(`No rate limit found for organisation ${organizationId}.`);
      }

      const organization = await this.rateLimitModel.findOne({ 
        org_id: new Types.ObjectId(organizationId) 
      }).select('assistants').lean();
      
      if (!organization) {
        throw new NotFoundException(`No rate limit found for organisation ${organizationId}.`);
      }

      const assistant = organization.assistants?.find(a => a.assistant_id.toString() === assistantId);
      if (!assistant) {
        throw new NotFoundException(`Assistant ${assistantId} rate limit not found in organisation ${organizationId}.`);
      }

      return this.createSuccessResponse(assistant, `Assistant ${assistantId} retrieved successfully.`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to retrieve assistant: ${error.message}`);
    }
  }

  async createAssistantRateLimit(organizationId: string, dto: CreateAssistantLimitDto): Promise<ApiResponse> {
    try {
      await this.validateAssistantBelongsToOrganization(organizationId, dto.assistant_id);

      const organizationRateLimitExists = await this.checkOrganizationRateLimitExists(organizationId);
      if (!organizationRateLimitExists) {
        throw new NotFoundException(`No rate limit configuration found for organisation ${organizationId}. Please create organization rate limit first.`);
      }

      const assistantRateLimitExists = await this.checkAssistantRateLimitExists(organizationId, dto.assistant_id);
      if (assistantRateLimitExists) {
        throw new ConflictException(`Rate limit already exists for assistant ${dto.assistant_id} in organisation ${organizationId}.`);
      }

      const organization = await this.rateLimitModel.findOne({ org_id: new Types.ObjectId(organizationId) });
      if (!organization) {
        throw new NotFoundException(`No rate limit configuration found for organisation ${organizationId}.`);
      }

      const currentAssistants = organization.assistants || [];
      const totalAllocated = this.getTotalAllocatedByAssistants(currentAssistants);
      const remainingBudget = this.getRemainingOrganizationBudget(organization, totalAllocated);
      const { limits: requestedLimits, defaultedFields } = this.prepareRequestedLimits(dto);

      const budgetValidation = this.validateBudgetAllocation(requestedLimits, remainingBudget);
      if (!budgetValidation.isValid) {
        const budgetInfo = this.createBudgetExhaustedResponse(budgetValidation.violations, remainingBudget);
        throw new HttpException(budgetInfo, HttpStatus.PRECONDITION_FAILED);
      }

      const userValidation = this.validateUserLimitsAgainstAssistantLimits(requestedLimits);
      if (!userValidation.isValid) {
        throw new BadRequestException(
          `User limit validation failed: ${userValidation.violations.join(' ')}`
        );
      }

      const assistantData = {
        assistant_id: new Types.ObjectId(dto.assistant_id),
        ...requestedLimits,
      };

      if (!organization.assistants) organization.assistants = [];
      organization.assistants.push(assistantData as any);
      await organization.save();

      const userCapacity = this.getMaxConcurrentUsers(requestedLimits);
      const responseData = {
        ...assistantData,
        capacity_info: userCapacity,
      };

      const info = defaultedFields.length > 0 ? {
        defaulted_fields: defaultedFields,
        default_value: 0,
        message: `${defaultedFields.length} field(s) were set to default value (0) because they were not provided`
      } : undefined;

      return this.createSuccessResponse(
        responseData, 
        `Assistant rate limit created successfully for ${dto.assistant_id} in organization ${organizationId}.`,
        undefined,
        info
      );
    } catch (error) {
      if (error instanceof ConflictException || 
          error instanceof NotFoundException || 
          error instanceof BadRequestException ||
          error instanceof HttpException) throw error;
      throw new BadRequestException(`Failed to create assistant rate limit: ${error.message}`);
    }
  }

  

  async deleteAssistantRateLimit(organizationId: string, assistantId: string): Promise<ApiResponse> {
    try {
      await this.validateAssistantBelongsToOrganization(organizationId, assistantId);
      
      const organizationRateLimitExists = await this.checkOrganizationRateLimitExists(organizationId);
      if (!organizationRateLimitExists) {
        throw new NotFoundException(`No rate limit configuration found for organisation ${organizationId}.`);
      }

      const organization = await this.rateLimitModel.findOne({ org_id: new Types.ObjectId(organizationId) });
      if (!organization) {
        throw new NotFoundException(`No rate limit configuration found for organisation ${organizationId}.`);
      }

      const assistantExists = organization.assistants?.some(a => a.assistant_id.toString() === assistantId);
      if (!assistantExists) {
        throw new NotFoundException(`Assistant ${assistantId} rate limit not found in organisation ${organizationId}.`);
      }

      organization.assistants = organization.assistants?.filter(a => a.assistant_id.toString() !== assistantId) || [];
      await organization.save();
      
      return this.createSuccessResponse(
        { deleted_assistant_id: assistantId }, 
        `Assistant ${assistantId} rate limit deleted successfully from organisation ${organizationId}.`
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to delete assistant rate limit: ${error.message}`);
    }
  }

  async addMultipleAssistantsToOrganization(organizationId: string, assistants: CreateAssistantLimitDto[]): Promise<ApiResponse> {
    try {
      await this.validateOrganizationExists(organizationId);

      const organizationRateLimitExists = await this.checkOrganizationRateLimitExists(organizationId);
      if (!organizationRateLimitExists) {
        throw new NotFoundException(`No rate limit configuration found for organisation ${organizationId}. Please create organization rate limit first.`);
      }

      const organization = await this.rateLimitModel.findOne({ org_id: new Types.ObjectId(organizationId) });
      if (!organization) {
        throw new NotFoundException(`No rate limit configuration found for organisation ${organizationId}.`);
      }

      const assistantIds = assistants.map(a => a.assistant_id);
      this.validateDuplicateAssistantIds(assistantIds);
      await this.validateMultipleAssistantsBelongToOrganization(organizationId, assistantIds);

      const results: any[] = [];
      const errors: string[] = [];

      for (const assistantDto of assistants) {
        try {
          const assistantRateLimitExists = await this.checkAssistantRateLimitExists(organizationId, assistantDto.assistant_id);
          if (assistantRateLimitExists) {
            errors.push(`Assistant ${assistantDto.assistant_id} already exists`);
            continue;
          }

          const currentAssistants = organization.assistants || [];
          const totalAllocated = this.getTotalAllocatedByAssistants(currentAssistants);
          const remainingBudget = this.getRemainingOrganizationBudget(organization, totalAllocated);
          const { limits: requestedLimits } = this.prepareRequestedLimits(assistantDto);

          const budgetValidation = this.validateBudgetAllocation(requestedLimits, remainingBudget);
          const userValidation = this.validateUserLimitsAgainstAssistantLimits(requestedLimits);
          
          if (!budgetValidation.isValid || !userValidation.isValid) {
            const allViolations = [...budgetValidation.violations, ...userValidation.violations];
            errors.push(`Assistant ${assistantDto.assistant_id}: ${allViolations.join(' ')}`);
            continue;
          }

          const assistantData = {
            assistant_id: new Types.ObjectId(assistantDto.assistant_id),
            ...requestedLimits,
          };

          organization.assistants.push(assistantData as any);
          results.push({
            assistant_id: assistantDto.assistant_id,
            status: 'created',
            limits: assistantData,
          });
        } catch (error) {
          errors.push(`Assistant ${assistantDto.assistant_id}: ${error.message}`);
        }
      }

      if (results.length > 0) {
        await organization.save();
      }

      const message = `Bulk assistant creation completed. Created: ${results.length}, Errors: ${errors.length}`;
      
      return this.createSuccessResponse({
        created_assistants: results,
        errors: errors,
        summary: {
          total_requested: assistants.length,
          successfully_created: results.length,
          failed: errors.length,
        }
      }, message);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to create multiple assistants: ${error.message}`);
    }
  }

  async patchOrganizationRateLimit(
  organizationId: string,
  updateDto: UpdateRateLimitDto
): Promise<ApiResponse> {
  await this.validateOrganizationExists(organizationId);
  const orgObjectId = new Types.ObjectId(organizationId);

  const orgToAssistantKey: Record<string, string[]> = {
    max_input_token: ['input_token_per_assistant', 'input_token_per_user'],
    max_output_token: ['output_token_per_assistant', 'output_token_per_user'],
    file_size: ['file_size'],
    file_count: ['file_count'],
    knowledge_base_index_size: ['knowledge_base_index_size']
  };

  const assistantsBody = updateDto.assistants ?? [];
  const updatedOrgKeys = Object.keys(updateDto).filter(key => orgToAssistantKey[key]);

  // Fetch current organisation to check if assistants exist
  const orgDoc = await this.rateLimitModel.findOne({ org_id: orgObjectId }).lean();
  const hasAssistants = orgDoc && Array.isArray(orgDoc.assistants) && orgDoc.assistants.length > 0;

  // Only require assistantsBody if PATCHing assistant-dependent keys AND assistants exist AND assistantsBody is missing
  if (updatedOrgKeys.length > 0 && hasAssistants && assistantsBody.length === 0) {
    throw new BadRequestException('Missing assistants for updated organization keys.');
  }

  let requiredKeys: string[] = [];
  updatedOrgKeys.forEach(key => requiredKeys.push(...orgToAssistantKey[key]));
  requiredKeys = Array.from(new Set(requiredKeys));

  // Validate assistants
  assistantsBody.forEach(a => {
    const keys = Object.keys(a).filter(
      k => k !== 'assistant_id' && a[k] !== undefined && a[k] !== null
    );
    requiredKeys.forEach(req => {
      if (!keys.includes(req)) {
        throw new BadRequestException(`Missing '${req}' in assistant PATCH.`);
      }
    });
    const extra = keys.filter(k => !requiredKeys.includes(k));
    if (extra.length > 0) {
      throw new BadRequestException(
        `Do not use these keys in assistant PATCH: ${extra.join(', ')}.`
      );
    }
  });

  for (const a of assistantsBody) {
    const valid = this.validateUserLimitsAgainstAssistantLimits(a);
    if (!valid.isValid) {
      throw new BadRequestException('User tokens exceed assistant tokens.');
    }
  }

  for (const orgKey of updatedOrgKeys) {
    const field = orgToAssistantKey[orgKey][0];
    const total = assistantsBody.reduce(
      (sum, a) => sum + (a as any)[field],
      0
    );
    if (total > (updateDto as any)[orgKey]) {
      throw new BadRequestException(
        `Sum of '${field}' exceeds organization '${orgKey}'.`
      );
    }
  }

  // (1) Update org-level fields (but skip assistant-dependent orgKeys)
  const orgLevelPayload: any = {};
  Object.keys(updateDto).forEach(key => {
    if (key !== 'assistants' ) {
      orgLevelPayload[key] = (updateDto as any)[key];
    }
  });
  if (orgLevelPayload.org_id) {
    orgLevelPayload.org_id = new Types.ObjectId(orgLevelPayload.org_id);
  }
  if (Object.keys(orgLevelPayload).length > 0) {
    await this.rateLimitModel.updateOne(
      { org_id: orgObjectId },
      { $set: orgLevelPayload },
      { omitUndefined: true }                           // <—— important
    );
  }

  // (2) Per-assistant update using arrayFilters
  for (const patch of assistantsBody) {
    const setOne: any = {};
    Object.keys(patch).forEach(key => {
      if (key !== 'assistant_id') {
        setOne[`assistants.$[elem].${key}`] = (patch as any)[key];
      }
    });

    await this.rateLimitModel.updateOne(
      { org_id: orgObjectId },
      { $set: setOne },
      {
        arrayFilters: [
          { 'elem.assistant_id': new Types.ObjectId(patch.assistant_id) }
        ],
        omitUndefined: true                                // <—— important
      }
    );
  }

  const updated = await this.rateLimitModel.findOne({ org_id: orgObjectId });
  return this.createSuccessResponse(updated, 'Patched successfully.');
}

  async patchAssistantRateLimit(
  organizationId: string,
  assistantId: string,
  updateDto: UpdateAssistantLimitDto
): Promise<ApiResponse> {
  await this.validateAssistantBelongsToOrganization(organizationId, assistantId);

  const org = await this.rateLimitModel.findOne({ org_id: new Types.ObjectId(organizationId) });
  if (!org) throw new NotFoundException(`No rate limit found for organisation ${organizationId}.`);

  const assistantIndex = org.assistants?.findIndex(a => a.assistant_id.toString() === assistantId);
  if (assistantIndex === undefined || assistantIndex === -1) {
    throw new NotFoundException(`Assistant ${assistantId} not found in organisation ${organizationId}.`);
  }

  // Merge only provided fields, keep previous values for others
  const prev = org.assistants[assistantIndex];
  const merged = {
    ...prev,
    ...Object.fromEntries(
      Object.entries(updateDto).filter(([_, v]) => v !== undefined && v !== null)
    ),
    assistant_id: new Types.ObjectId(assistantId)
  };

  // Collect all violations
  const violations: string[] = [];

  // Validate user tokens ≤ assistant tokens
  const userValidation = this.validateUserLimitsAgainstAssistantLimits(merged);
  if (!userValidation.isValid) {
    violations.push(...userValidation.violations.map(v => `User limit: ${v}`));
  }

  // Calculate available budget BEFORE patch
  const otherAssistants = org.assistants.filter((_, idx) => idx !== assistantIndex);
  const totalAllocatedByOthers = this.getTotalAllocatedByAssistants(otherAssistants);
  const availableBudget = this.getRemainingOrganizationBudget(org, totalAllocatedByOthers);

  // Validate against available budget
  const budgetValidation = this.validateBudgetAllocation(merged, availableBudget);
  if (!budgetValidation.isValid) {
    violations.push(...budgetValidation.violations.map(v => `Budget: ${v}`));
  }

  // If any violations, return all in error message
  if (violations.length > 0) {
    throw new BadRequestException(
      `Assistant '${assistantId}' PATCH failed: ${violations.join('; ')}`
    );
  }

  org.assistants[assistantIndex] = merged;
  await org.save();

  return this.createSuccessResponse(
    org.assistants[assistantIndex],
    `Assistant rate limit patched successfully for ${assistantId} in organization ${organizationId}.`
  );
}



  async getAllLogs() {
    // Fetch all documents sorted by updatedAt descending
    return this.rateLimitLogsModel.find().sort({ updatedAt: -1 }).lean().exec();
  }
}


// TODO: Implement organization rate limit replacement
  // async replaceOrganizationRateLimit(organizationId: string, dto: ReplaceRateLimitDto): Promise<ApiResponse> {
  //   try {
  //     await this.validateOrganizationExists(organizationId);

  //     const rateLimitExists = await this.checkOrganizationRateLimitExists(organizationId);
  //     if (!rateLimitExists) {
  //       throw new NotFoundException(`No rate limit found for organisation ${organizationId}.`);
  //     }

  //     const currentOrganization = await this.rateLimitModel.findOne({ 
  //       org_id: new Types.ObjectId(organizationId) 
  //     });

  //     const dtoWithOrgId = { ...dto, org_id: organizationId };
  //     const { data: newRateLimitData, defaultedFields } = this.prepareRateLimitData(dtoWithOrgId as any);
      
  //     const currentAssistants = currentOrganization?.assistants || [];
  //     const clashAnalysis = this.analyzeOrganizationBudgetClash(newRateLimitData, currentAssistants);

  //     if (clashAnalysis.hasClash && currentAssistants.length > 0) {
  //       const distributedAssistants = this.distributeEquallyToAssistants(newRateLimitData, currentAssistants);
  //       newRateLimitData.assistants = distributedAssistants.updatedAssistants;
        
  //       const result = await this.rateLimitModel.findOneAndUpdate(
  //         { org_id: new Types.ObjectId(organizationId) },
  //         newRateLimitData,
  //         { new: true, runValidators: true }
  //       );

  //       const distributionInfo = {
  //         operation_type: 'replace_with_auto_distribution',
  //         distribution_strategy: 'equal_distribution',
  //         conflicts_detected: clashAnalysis.conflicts,
  //         distribution_summary: distributedAssistants.distributionSummary,
  //         affected_assistants: distributedAssistants.affectedAssistants
  //       };

  //       const info = {
  //         ...(defaultedFields.length > 0 && {
  //           defaulted_fields: defaultedFields,
  //           default_value: 0,
  //           message: `${defaultedFields.length} field(s) were set to default value (0)`
  //         }),
  //         distribution_info: distributionInfo
  //       };

  //       return this.createSuccessResponse(
  //         result,
  //         `Organization rate limit replaced and budget automatically distributed equally among ${currentAssistants.length} assistant(s).`,
  //         undefined,
  //         info
  //       );
  //     }

  //     const result = await this.rateLimitModel.findOneAndUpdate(
  //       { org_id: new Types.ObjectId(organizationId) },
  //       newRateLimitData,
  //       { new: true, runValidators: true }
  //     );

  //     const info = defaultedFields.length > 0 ? {
  //       defaulted_fields: defaultedFields,
  //       default_value: 0,
  //       message: `${defaultedFields.length} field(s) were set to default value (0)`
  //     } : undefined;

  //     return this.createSuccessResponse(
  //       result,
  //       `Organization rate limit replaced successfully for ${organizationId}.`,
  //       undefined,
  //       info
  //     );
  //   } catch (error) {
  //     if (error instanceof ConflictException || 
  //         error instanceof NotFoundException || 
  //         error instanceof BadRequestException) {
  //       throw error;
  //     }
  //     throw new BadRequestException(`Failed to replace organization rate limit: ${error.message}`);
  //   }
  // }
  // TODO: Implement assistant rate limit replacement
  // async replaceAssistantRateLimit(organizationId: string, assistantId: string, dto: ReplaceAssistantLimitDto): Promise<ApiResponse> {
  //   try {
  //     await this.validateAssistantBelongsToOrganization(organizationId, assistantId);
      
  //     const organizationRateLimitExists = await this.checkOrganizationRateLimitExists(organizationId);
  //     if (!organizationRateLimitExists) {
  //       throw new NotFoundException(`No rate limit configuration found for organisation ${organizationId}.`);
  //     }

  //     const organization = await this.rateLimitModel.findOne({ org_id: new Types.ObjectId(organizationId) });
  //     if (!organization) {
  //       throw new NotFoundException(`No rate limit configuration found for organisation ${organizationId}.`);
  //     }

  //     const assistantIndex = organization.assistants?.findIndex(a => a.assistant_id.toString() === assistantId);
  //     if (assistantIndex === undefined || assistantIndex === -1) {
  //       throw new NotFoundException(`Assistant ${assistantId} rate limit not found in organisation ${organizationId}.`);
  //     }

  //     const otherAssistants = organization.assistants.filter((_, index) => index !== assistantIndex);
  //     const totalAllocatedByOthers = this.getTotalAllocatedByAssistants(otherAssistants);
  //     const remainingBudget = this.getRemainingOrganizationBudget(organization, totalAllocatedByOthers);
      
  //     const dtoWithAssistantId = { ...dto, assistant_id: assistantId };
  //     const { limits: requestedLimits, defaultedFields } = this.prepareRequestedLimits(dtoWithAssistantId as any);

  //     const budgetValidation = this.validateBudgetAllocation(requestedLimits, remainingBudget);
  //     if (!budgetValidation.isValid) {
  //       const budgetInfo = this.createBudgetExhaustedResponse(budgetValidation.violations, remainingBudget);
  //       throw new HttpException(budgetInfo, HttpStatus.PRECONDITION_FAILED);
  //     }

  //     const userValidation = this.validateUserLimitsAgainstAssistantLimits(requestedLimits);
  //     if (!userValidation.isValid) {
  //       throw new BadRequestException(
  //         `User limit validation failed: ${userValidation.violations.join(' ')}`
  //       );
  //     }

  //     const assistantData = {
  //       assistant_id: new Types.ObjectId(assistantId),
  //       ...requestedLimits,
  //     };

  //     organization.assistants[assistantIndex] = assistantData as any;
  //     await organization.save();

  //     const userCapacity = this.getMaxConcurrentUsers(requestedLimits);
  //     const responseData = {
  //       ...assistantData,
  //       capacity_info: userCapacity,
  //     };

  //     const info = defaultedFields.length > 0 ? {
  //       defaulted_fields: defaultedFields,
  //       default_value: 0,
  //       message: `${defaultedFields.length} field(s) were set to default value (0)`
  //     } : undefined;

  //     return this.createSuccessResponse(
  //       responseData,
  //       `Assistant rate limit replaced successfully for ${assistantId} in organization ${organizationId}.`,
  //       undefined,
  //       info
  //     );
  //   } catch (error) {
  //     if (error instanceof ConflictException || 
  //         error instanceof NotFoundException || 
  //         error instanceof BadRequestException ||
  //         error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new BadRequestException(`Failed to replace assistant rate limit: ${error.message}`);
  //   }
  // }
  // TODO: Implement organization rate limit replacement
  // async replaceOrganizationRateLimit(organizationId: string, dto: ReplaceRateLimitDto): Promise<ApiResponse> {
  //   try {
  //     await this.validateOrganizationExists(organizationId);

  //     const rateLimitExists = await this.checkOrganizationRateLimitExists(organizationId);
  //     if (!rateLimitExists) {
  //       throw new NotFoundException(`No rate limit found for organisation ${organizationId}.`);
  //     }

  //     const currentOrganization = await this.rateLimitModel.findOne({ 
  //       org_id: new Types.ObjectId(organizationId) 
  //     });

  //     const dtoWithOrgId = { ...dto, org_id: organizationId };
  //     const { data: newRateLimitData, defaultedFields } = this.prepareRateLimitData(dtoWithOrgId as any);
      
  //     const currentAssistants = currentOrganization?.assistants || [];
  //     const clashAnalysis = this.analyzeOrganizationBudgetClash(newRateLimitData, currentAssistants);

  //     if (clashAnalysis.hasClash && currentAssistants.length > 0) {
  //       const distributedAssistants = this.distributeEquallyToAssistants(newRateLimitData, currentAssistants);
  //       newRateLimitData.assistants = distributedAssistants.updatedAssistants;
        
  //       const result = await this.rateLimitModel.findOneAndUpdate(
  //         { org_id: new Types.ObjectId(organizationId) },
  //         newRateLimitData,
  //         { new: true, runValidators: true }
  //       );

  //       const distributionInfo = {
  //         operation_type: 'replace_with_auto_distribution',
  //         distribution_strategy: 'equal_distribution',
  //         conflicts_detected: clashAnalysis.conflicts,
  //         distribution_summary: distributedAssistants.distributionSummary,
  //         affected_assistants: distributedAssistants.affectedAssistants
  //       };

  //       const info = {
  //         ...(defaultedFields.length > 0 && {
  //           defaulted_fields: defaultedFields,
  //           default_value: 0,
  //           message: `${defaultedFields.length} field(s) were set to default value (0)`
  //         }),
  //         distribution_info: distributionInfo
  //       };

  //       return this.createSuccessResponse(
  //         result,
  //         `Organization rate limit replaced and budget automatically distributed equally among ${currentAssistants.length} assistant(s).`,
  //         undefined,
  //         info
  //       );
  //     }

  //     const result = await this.rateLimitModel.findOneAndUpdate(
  //       { org_id: new Types.ObjectId(organizationId) },
  //       newRateLimitData,
  //       { new: true, runValidators: true }
  //     );

  //     const info = defaultedFields.length > 0 ? {
  //       defaulted_fields: defaultedFields,
  //       default_value: 0,
  //       message: `${defaultedFields.length} field(s) were set to default value (0)`
  //     } : undefined;

  //     return this.createSuccessResponse(
  //       result,
  //       `Organization rate limit replaced successfully for ${organizationId}.`,
  //       undefined,
  //       info
  //     );
  //   } catch (error) {
  //     if (error instanceof ConflictException || 
  //         error instanceof NotFoundException || 
  //         error instanceof BadRequestException) {
  //       throw error;
  //     }
  //     throw new BadRequestException(`Failed to replace organization rate limit: ${error.message}`);
  //   }
  // }
