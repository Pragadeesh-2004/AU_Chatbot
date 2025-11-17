import { Controller, Post, Get, Body, Res, Req, UseGuards, BadRequestException, Query } from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { Response, Request } from 'express';
import { AuthenticationService } from './authentication.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly jwtAuthService: AuthService, // used to sign JWTs for cookie
  ) {}

  // Combined: Check user and send verification email
  @Post('signup')
  async signup(@Body() body: { college: string; role: string; id: string }) {
    try {
      return await this.authService.signupAndSendEmail(body.college, body.role, body.id);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  // Called by frontend when user clicks verification link
  @Post('verify-code')
  async verifyCode(@Body() body: { college: string; role: string; id: string; code: string }) {
    try {
      return await this.authService.verifyCodeWithInput(body.role, body.id, body.code);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  // Complete verification with password
  @Post('verify')
  async verify(@Body() body: { token: string; password: string; college: string }) {
    try {
      return await this.authService.verify(body.token, body.password, body.college);
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

  // Fixed login method to include college parameter
  @Public()
  @Post('login')
  async login(@Body() body: { college: string; role: string; id: string; password: string }, @Res() res: Response) {
    try {
      const result = await this.authService.login(body.college, body.role, body.id, body.password);
      const user = result.user;
      const token = await this.jwtAuthService.signToken({ sub: user.id, role: user.role, name: user.name });
      const isProdLike = (process.env.NODE_ENV === 'production') || !!process.env.FORCE_SECURE_COOKIES;
      const sameSite = (process.env.COOKIE_SAMESITE as any) || (isProdLike ? 'none' : 'lax');
      res.cookie('jwt', token, { httpOnly: true, secure: isProdLike, sameSite, path: '/', maxAge: 7*24*60*60*1000 });
      return res.json({ success: true, user: { id: user.id, role: user.role, name: user.name } });
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('forgot-password/send-code')
  async forgotPasswordSendCode(@Body() body: { college: string; role: string; id: string }) {
    try {
      return await this.authService.sendResetCode(body.college, body.role, body.id);
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
  async forgotPasswordReset(@Body() body: { college: string; role: string; id: string; code: string; password: string }) {
    try {
      return await this.authService.resetPassword(body.college, body.role, body.id, body.code, body.password);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Public()
  @Post('guest-visit')
  async guestVisit(@Body() body: { college: string; guestType: 'visitor' | 'university_member' }) {
    if (!['visitor', 'university_member'].includes(body.guestType)) {
      throw new Error('Invalid guest type');
    }
    return this.authService.incrementGuestVisit(body.college, body.guestType);
  }

  // New: return verification/resend status for a role+id
  @Get('verification')
  async getVerificationStatus(@Query() query: { role: string; id: string }) {
    try {
      return await this.authService.getVerificationStatus(query.role, query.id);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  // Set JWT cookie after successful signup/login flow
  @Public()
  @Post('set-cookie')
  async setCookie(@Body() body: { id: string; role: string; name?: string }, @Res() res: Response) {
    const token = await this.jwtAuthService.signToken({ sub: body.id, role: body.role, name: body.name });
    const isProdLike = (process.env.NODE_ENV === 'production') || !!process.env.FORCE_SECURE_COOKIES;
    const sameSite = (process.env.COOKIE_SAMESITE as any) || (isProdLike ? 'none' : 'lax'); // override with env if needed
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: isProdLike,
      sameSite,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.json({ success: true });
  }

  // Clear JWT cookie (logout)
  @Public()
  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('jwt', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    return res.json({ success: true });
  }

  // Return current authenticated user (reads JWT from cookie)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    console.log('REQ HEADERS:', req.headers);
    console.log('REQ COOKIES:', req.cookies);
    // @ts-ignore
    return { user: req.user };
  }
}