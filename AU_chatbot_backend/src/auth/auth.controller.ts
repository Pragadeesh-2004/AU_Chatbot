import { Controller, Post, Body, Res, Req, Get, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Called after verifying credentials (login/verify). Example payload: { id, role, name }
  @Post('set-cookie')
  async setCookie(@Body() body: { id: string; role: string; name?: string }, @Res() res: Response) {
    const token = await this.authService.signToken({ sub: body.id, role: body.role, name: body.name });
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.json({ success: true });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('jwt', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    return res.json({ success: true });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    // validated user object placed on req.user by JwtStrategy
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return { user: req.user };
  }
}