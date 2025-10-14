import { Controller, Post, Get, Body, Query, BadRequestException } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';

@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  // Combined: Check user and send verification email
  @Post('signup')
  async signup(@Body() body: { role: string; id: string }) {
    try {
      return await this.authService.signupAndSendEmail(body.role, body.id);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  // Called by frontend when user clicks verification link
  @Get('verify-code')
  async verifyCode(@Query('role') role: string, @Query('id') id: string, @Query('code') code: string) {
    try {
      return await this.authService.verifyCode(role, id, code);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  // Complete verification with password
  @Post('verify')
  async verify(@Body() body: { token: string; password: string }) {
    try {
      return await this.authService.verify(body.token, body.password);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Get('all-anna-details')
  async getAllAnnaDetails() {
    try {
      return await this.authService.getAllAnnaDetails();
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}