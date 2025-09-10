import { Controller, Get, Post, Delete, Body, Param, Query, ValidationPipe, Patch } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { CreateRateLimitDto } from './dto/create-rate-limit.dto';
import { CreateAssistantLimitDto } from './dto/create-assistant-limit.dto';
import { UpdateRateLimitDto } from './dto/update-rate-limit.dto';
import { UpdateAssistantLimitDto } from './dto/update-assistant-limit.dto';

@Controller('rate-limit')
export class RateLimitController {
  constructor(private readonly rateLimitService: RateLimitService) {}

  @Get('organisation')
  async getOrganizationRateLimits(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('filter') filter?: string,
  ) {
    let filterObj = {};
    if (filter) {
      try {
        filterObj = JSON.parse(filter);
      } catch (err) {
        filterObj = {};
      }
    }
    return this.rateLimitService.getOrganizationRateLimits(page, limit, filterObj);
  }

  @Get('organisation/:organizationId')
  async getOrganizationRateLimit(
    @Param('organizationId') organizationId: string,
    @Query('filter') filter?: string,
  ) {
    let filterObj = {};
    if (filter) {
      try {
        filterObj = JSON.parse(filter);
      } catch (err) {
        filterObj = {};
      }
    }
    return this.rateLimitService.getOrganizationRateLimit(organizationId);
  }

  @Get('organisation/:organizationId/assistant')
  async getAssistantRateLimits(
    @Param('organizationId') organizationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('filter') filter?: string,
  ) {
    let filterObj = {};
    if (filter) {
      try {
        filterObj = JSON.parse(filter);
      } catch (err) {
        filterObj = {};
      }
    }
    return this.rateLimitService.getAssistantRateLimits(organizationId, page, limit, filterObj);
  }

  @Get('organisation/:organizationId/assistant/:assistantId')
  async getAssistantRateLimit(
    @Param('organizationId') organizationId: string,
    @Param('assistantId') assistantId: string,
    @Query('filter') filter?: string,
  ) {
    let filterObj = {};
    if (filter) {
      try {
        filterObj = JSON.parse(filter);
      } catch (err) {
        filterObj = {};
      }
    }
    return this.rateLimitService.getAssistantRateLimit(organizationId, assistantId);
  }

  @Post('organisation')
  async createOrganizationRateLimit(@Body(ValidationPipe) createRateLimitDto: CreateRateLimitDto) {
    return this.rateLimitService.createOrganizationRateLimit(createRateLimitDto);
  }

  @Patch('organisation/:organizationId')
  async patchOrganizationRateLimit(
    @Param('organizationId') organizationId: string,
    @Body(ValidationPipe) updateDto: UpdateRateLimitDto,
  ) {
    return this.rateLimitService.patchOrganizationRateLimit(organizationId, updateDto);
  }

  @Delete('organisation/:organizationId')
  async deleteOrganizationRateLimit(@Param('organizationId') organizationId: string) {
    return this.rateLimitService.deleteOrganizationRateLimit(organizationId);
  }

  @Post('organisation/:organizationId/assistant')
  async createAssistantRateLimit(
    @Param('organizationId') organizationId: string,
    @Body(ValidationPipe) createAssistantLimitDto: CreateAssistantLimitDto,
  ) {
    return this.rateLimitService.createAssistantRateLimit(organizationId, createAssistantLimitDto);
  }

  @Patch('organisation/:organizationId/assistant/:assistantId')
  async patchAssistantRateLimit(
    @Param('organizationId') organizationId: string,
    @Param('assistantId') assistantId: string,
    @Body(ValidationPipe) updateDto: UpdateAssistantLimitDto,
  ) {
    return this.rateLimitService.patchAssistantRateLimit(organizationId, assistantId, updateDto);
  }

  @Delete('organisation/:organizationId/assistant/:assistantId')
  async deleteAssistantRateLimit(
    @Param('organizationId') organizationId: string,
    @Param('assistantId') assistantId: string,
  ) {
    return this.rateLimitService.deleteAssistantRateLimit(organizationId, assistantId);
  }

  @Get('logs')
  async getLogs() {
    return this.rateLimitService.getAllLogs();
  }
}
