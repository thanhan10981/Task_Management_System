import { Controller, Post, Body, Get, UseGuards, Request, Response, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../service/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
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
  @ApiOperation({ summary: 'Login and receive auth cookies' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid credentials' })
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
  @ApiOperation({ summary: 'Refresh access token using refreshToken cookie' })
  @ApiCookieAuth('accessToken')
  @ApiResponse({ status: HttpStatus.OK, description: 'Token refreshed successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid refresh token' })
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

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'If email exists, reset link is sent' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      message: 'If your email is registered, a reset link has been sent',
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using reset token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password has been reset successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid reset token or payload' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return {
      message: 'Password has been reset successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout current user and clear cookies' })
  @ApiCookieAuth('accessToken')
  @ApiResponse({ status: HttpStatus.OK, description: 'Logout successful' })
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
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiCookieAuth('accessToken')
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile retrieved successfully' })
  getProfile(@Request() req: any) {
    return {
      data: req.user,
    };
  }
}
