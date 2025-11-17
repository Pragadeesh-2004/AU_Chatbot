import { Controller, Get, Put, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('rate-limits/:role')
  async getRateLimit(@Param('role') role: string) {
    return this.adminService.getRateLimit(role);
  }

  @Put('rate-limits/:role')
  async setRateLimit(@Param('role') role: string, @Body() body: any) {
    return this.adminService.setRateLimit(role, body);
  }

  @Post('user-rate-limit')
  async createUserRateLimit(@Body() body: { role: string; userId: string; name: string }) {
    return this.adminService.createUserRateLimit(body.role, body.userId, body.name);
  }

  @Get('user-rate-limit/:role/:userId')
  async getUserRateLimit(@Param('role') role: string, @Param('userId') userId: string) {
    return this.adminService.getUserRateLimit(role, userId);
  }

  @Put('user-usage/:role/:userId')
  async updateUserUsage(
    @Param('role') role: string,
    @Param('userId') userId: string,
    @Body() usage: { requests?: number; tokens?: { input?: number; output?: number }; files?: number; memory?: number }
  ) {
    return this.adminService.updateUserUsage(role, userId, usage);
  }

  @Delete('user-rate-limit/:role/:userId')
  async deleteUserRateLimit(@Param('role') role: string, @Param('userId') userId: string) {
    await this.adminService.deleteUserRateLimit(role, userId);
    return { success: true };
  }

  @Get('user-data')
  async getUserData() {
    return this.adminService.getUserData();
  }

  // New endpoints for dashboard statistics
  @Get('statistics/users')
  async getUserStatistics() {
    return this.adminService.getUserStatistics();
  }

  @Get('statistics/guests')
  async getGuestStatistics() {
    return this.adminService.getGuestStatistics();
  }
}