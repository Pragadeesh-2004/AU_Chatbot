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
  @Post('verify-code')
  async verifyCode(@Body() body: { role: string; id: string; code: string }) {
    try {
      return await this.authService.verifyCodeWithInput(body.role, body.id, body.code);
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

  @Post('login')
  async login(@Body() body: { role: string; id: string; password: string }) {
    try {
      return await this.authService.login(body.role, body.id, body.password);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('forgot-password/send-code')
  async forgotPasswordSendCode(@Body() body: { role: string; id: string }) {
    try {
      return await this.authService.sendResetCode(body.role, body.id);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('forgot-password/verify-code')
  async forgotPasswordVerifyCode(@Body() body: { role: string; id: string; code: string }) {
    try {
      return await this.authService.verifyResetCode(body.role, body.id, body.code);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('forgot-password/reset')
  async forgotPasswordReset(@Body() body: { role: string; id: string; code: string; password: string }) {
    try {
      return await this.authService.resetPassword(body.role, body.id, body.code, body.password);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('guest-visit')
  async guestVisit(@Body() body: { guestType: 'visitor' | 'university' }) {
    if (!['visitor', 'university'].includes(body.guestType)) {
      throw new Error('Invalid guest type');
    }
    return this.authService.incrementGuestVisit(body.guestType);
  }
}