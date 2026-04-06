import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt } from 'crypto';
import { buildMailFrom } from '../../../common/helpers/mail-from.helper';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

type JwtPayload = {
  sub: string;
  email: string;
  exp?: number;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {}

  async register(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new ConflictException({
        message: 'Validation failed',
        errors: { confirmPassword: ["Passwords don't match"] },
      });
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException({
        message: 'Validation failed',
        errors: { email: ['Email is already in use'] },
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        fullName: registerDto.fullName,
        passwordHash: passwordHash,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return this.generateTokens(userWithoutPassword);
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return this.generateTokens(userWithoutPassword);
  }

  async refreshToken(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);
    const remainingLifetime = this.getRemainingLifetime(payload.exp);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    const tokenPayload = { sub: userWithoutPassword.id, email: userWithoutPassword.email };

    const [accessToken, newRefreshToken] = await Promise.all([
      this.generateAccessToken(tokenPayload),
      this.generateRefreshTokenWithRemainingLifetime(tokenPayload, remainingLifetime),
    ]);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: userWithoutPassword,
    };
  }

  async logout(userId: string) {
    return { success: true };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    // Do not reveal whether email exists.
    if (!user) {
      return;
    }

    const verificationCode = this.generateResetCode();
    const codeHash = this.hashResetCode(verificationCode);
    const expiresInMinutes = this.getResetCodeExpiryMinutes();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.notification.deleteMany({
        where: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          isRead: false,
          data: {
            path: ['purpose'],
            equals: 'PASSWORD_RESET_OTP',
          },
        },
      }),
      this.prisma.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          title: 'Password reset verification',
          content: 'Use verification code to reset password',
          data: {
            purpose: 'PASSWORD_RESET_OTP',
            codeHash,
            expiresAt: expiresAt.toISOString(),
          },
        },
      }),
    ]);

    try {
      await this.mailerService.sendMail({
        to: user.email,
        from: buildMailFrom(
          this.configService.get<string>('MAIL_PUBLIC_FROM_NAME'),
          this.configService.get<string>('MAIL_PUBLIC_FROM_ADDRESS'),
        ),
        subject: 'Password Reset Verification Code',
        text: [
          `Dear ${user.fullName},`,
          '',
          'We received a request to reset your account password.',
          `Your verification code is: ${verificationCode}`,
          `This code will expire in ${expiresInMinutes} minutes.`,
          '',
          'If you did not make this request, please ignore this email.',
          '',
          'Best regards,',
          'Task Management Team',
        ].join('\n'),
        html: `
          <p>Dear ${user.fullName},</p>
          <p>We received a request to reset your account password.</p>
          <p><strong>Your verification code is:</strong> ${verificationCode}</p>
          <p>This code will expire in <strong>${expiresInMinutes} minutes</strong>.</p>
          <p>If you did not make this request, please ignore this email.</p>
          <p>Best regards,<br/>Task Management Team</p>
        `,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown mail error';
      this.logger.error(`Failed to send password reset email to ${user.email}: ${message}`);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new ConflictException({
        message: 'Validation failed',
        errors: { confirmPassword: ["Passwords don't match"] },
      });
    }

    const user = await this.prisma.user.findUnique({
      where: {
        email: resetPasswordDto.email,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const notification = await this.prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        isRead: false,
        data: {
          path: ['purpose'],
          equals: 'PASSWORD_RESET_OTP',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        data: true,
      },
    });

    if (!notification) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const storedCodeHash = this.readStringFromJson(notification.data, 'codeHash');
    const storedExpiresAt = this.readStringFromJson(notification.data, 'expiresAt');

    if (!storedCodeHash || !storedExpiresAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date(storedExpiresAt).getTime() <= Date.now()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const incomingCodeHash = this.hashResetCode(resetPasswordDto.verificationCode);
    if (storedCodeHash !== incomingCodeHash) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, salt);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      }),
      this.prisma.notification.deleteMany({
        where: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          isRead: false,
          id: {
            not: notification.id,
          },
          data: {
            path: ['purpose'],
            equals: 'PASSWORD_RESET_OTP',
          },
        },
      }),
    ]);
  }

  private async generateTokens(user: Omit<any, 'passwordHash'>) {
    const payload = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  private verifyRefreshToken(refreshToken: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private getRemainingLifetime(exp?: number): number {
    if (!exp) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const remainingLifetime = exp - currentTimeInSeconds;

    if (remainingLifetime <= 0) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return remainingLifetime;
  }

  private generateAccessToken(payload: { sub: string; email: string }) {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });
  }

  private generateRefreshToken(payload: { sub: string; email: string }) {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });
  }

  private generateRefreshTokenWithRemainingLifetime(
    payload: { sub: string; email: string },
    remainingLifetime: number,
  ) {
    // Keep the original refresh token expiry boundary to prevent infinite sliding sessions.
    // We only mint a new refresh token for the exact time that remains.
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: remainingLifetime,
    });
  }

  private generateResetCode() {
    return String(randomInt(100000, 1000000));
  }

  private hashResetCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }

  private getResetCodeExpiryMinutes() {
    const rawValue = this.configService.get<string>('RESET_PASSWORD_CODE_EXPIRES_MINUTES') ?? '15';
    const value = Number(rawValue);

    if (!Number.isInteger(value) || value <= 0) {
      return 15;
    }

    return value;
  }

  private readStringFromJson(value: unknown, key: string): string | undefined {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    const target = record[key];

    return typeof target === 'string' ? target : undefined;
  }
}
