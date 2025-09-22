import { Controller, Post, Get, Body, BadRequestException } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';

@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('signup')
  async signup(@Body() body: { role: string; id: string }) {
    try {
      return await this.authService.signup(body.role, body.id);
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