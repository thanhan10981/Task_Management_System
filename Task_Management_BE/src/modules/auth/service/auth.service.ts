import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { buildMailFrom } from '../../../common/helpers/mail-from.helper';
import { MailJobQueueService } from '../../../common/mail/services/mail-job-queue.service';
import { resetPasswordTemplate } from '../../../common/mail/templates/reset-password.template';
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
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailJobQueueService: MailJobQueueService,
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

  async logout(_userId: string) {
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

    if (!user) {
      return;
    }

    const resetToken = randomUUID();
    const tokenHash = this.hashResetCode(resetToken);
    const expiresInMinutes = this.getResetCodeExpiryMinutes();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:5173';
    const normalizedClientUrl = clientUrl.replace(/\/$/, '');
    const resetLink = `${normalizedClientUrl}/auth/reset-password?token=${encodeURIComponent(
      resetToken,
    )}`;

    await this.prisma.$transaction([
      this.prisma.notification.deleteMany({
        where: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          isRead: false,
          data: {
            path: ['purpose'],
            equals: 'PASSWORD_RESET_TOKEN',
          },
        },
      }),
      this.prisma.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          title: 'Password reset request',
          content: 'Use reset link to reset password',
          data: {
            purpose: 'PASSWORD_RESET_TOKEN',
            tokenHash,
            expiresAt: expiresAt.toISOString(),
          },
        },
      }),
    ]);

    const mail = resetPasswordTemplate(user.fullName, resetLink, expiresInMinutes);

    this.mailJobQueueService.enqueue({
      to: user.email,
      from: buildMailFrom(
        this.configService.get<string>('MAIL_PUBLIC_FROM_NAME'),
        this.configService.get<string>('MAIL_PUBLIC_FROM_ADDRESS'),
      ),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new ConflictException({
        message: 'Validation failed',
        errors: { confirmPassword: ["Passwords don't match"] },
      });
    }

    const incomingTokenHash = this.hashResetCode(resetPasswordDto.resetToken);

    const notification = await this.prisma.notification.findFirst({
      where: {
        type: NotificationType.SYSTEM,
        isRead: false,
        AND: [
          {
            data: {
              path: ['purpose'],
              equals: 'PASSWORD_RESET_TOKEN',
            },
          },
          {
            data: {
              path: ['tokenHash'],
              equals: incomingTokenHash,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        data: true,
      },
    });

    if (!notification) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const storedCodeHash = this.readStringFromJson(notification.data, 'tokenHash');
    const storedExpiresAt = this.readStringFromJson(notification.data, 'expiresAt');

    if (!storedCodeHash || !storedExpiresAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date(storedExpiresAt).getTime() <= Date.now()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (storedCodeHash !== incomingTokenHash) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, salt);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: notification.userId },
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
          userId: notification.userId,
          type: NotificationType.SYSTEM,
          isRead: false,
          id: {
            not: notification.id,
          },
          data: {
            path: ['purpose'],
            equals: 'PASSWORD_RESET_TOKEN',
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
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: remainingLifetime,
    });
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
