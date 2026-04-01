import { Controller, Post, Body, Get, UseGuards, Request, Response, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Response() res: any) {
    const data = await this.authService.register(registerDto);
    
    // Set httpOnly cookies
    res.cookie('accessToken', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      data: { user: data.user },
      message: 'Registration successful',
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Response() res: any) {
    const data = await this.authService.login(loginDto);

    // Set httpOnly cookies
    res.cookie('accessToken', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      data: { user: data.user },
      message: 'Login successful',
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req: any, @Response() res: any) {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    
    const data = await this.authService.refreshToken(refreshToken);

    // Set new accessToken cookie
    res.cookie('accessToken', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return res.json({
      message: 'Token refreshed successfully',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any, @Response() res: any) {
    await this.authService.logout(req.user.id);
    
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.json({
      message: 'Logged out successfully',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return {
      data: req.user,
    };
  }
}
