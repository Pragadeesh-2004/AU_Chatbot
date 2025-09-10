// src/auth/auth.controller.ts
import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorators';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Get('login')
  getLoginPage(@Res() res: Response) {
    res.render('login', { error: null });
  }

  @Public()
  @Post('login')
  async login(@Body() body: any, @Res() res: Response) {
    try {
      const tokenData = await this.authService.validateUserAndLogin(body);
      console.log(tokenData)
      res.cookie('jwt', tokenData.access_token, { httpOnly: true });
      if (tokenData.role === 'ADMIN') {
          return res.redirect('/dashboard/superadmin');
      } else {
          return res.redirect(`/dashboard/organisation?orgId=${tokenData.organisationId}`);
      }

    } catch {
      return res.render('login', { error: 'Invalid credentials' });
    }
  }
}
