import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, createVerify, randomUUID } from 'crypto';
import Redis from 'ioredis';
import { buildMailFrom } from '../../../common/helpers/mail-from.helper';
import { MailJobQueueService } from '../../../common/mail/services/mail-job-queue.service';
import { resetPasswordTemplate } from '../../../common/mail/templates/reset-password.template';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { REDIS_CLIENT } from '../../../config/redis/redis.constants';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

type JwtPayload = {
  sub: string;
  email: string;
  exp?: number;
};

type FirebaseJwtHeader = {
  alg?: string;
  kid?: string;
};

type FirebaseIdTokenPayload = {
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  firebase?: {
    sign_in_provider?: string;
  };
};

const PASSWORD_RESET_TOKEN_PREFIX = 'auth:password-reset:token';
const PASSWORD_RESET_USER_PREFIX = 'auth:password-reset:user';
const PASSWORD_RESET_COOLDOWN_PREFIX = 'auth:password-reset:cooldown';
const PASSWORD_RESET_EMAIL_COOLDOWN_SECONDS = 60;
const FIREBASE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

@Injectable()
export class AuthService {
  private firebaseCertCache: {
    certs: Record<string, string>;
    expiresAt: number;
  } | null = null;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailJobQueueService: MailJobQueueService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
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

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

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
    const tokenPayload = {
      sub: userWithoutPassword.id,
      email: userWithoutPassword.email,
    };

    const [accessToken, newRefreshToken] = await Promise.all([
      this.generateAccessToken(tokenPayload),
      this.generateRefreshTokenWithRemainingLifetime(
        tokenPayload,
        remainingLifetime,
      ),
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

  async loginWithFirebase(idToken: string) {
    const firebaseUser = await this.verifyFirebaseIdToken(idToken);
    const email = firebaseUser.email?.trim().toLowerCase();
    const signInProvider = firebaseUser.firebase?.sign_in_provider;

    if (!email) {
      throw new UnauthorizedException('Firebase account email is missing');
    }

    if (
      signInProvider === 'google.com' &&
      firebaseUser.email_verified !== true
    ) {
      throw new UnauthorizedException('Firebase account email is not verified');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    const user =
      existingUser ||
      (await this.createGoogleUser(
        email,
        firebaseUser.name || email,
        firebaseUser.picture,
      ));

    const { passwordHash: _, ...userWithoutPassword } = user;
    return this.generateTokens(userWithoutPassword);
  }

  private createGoogleUser(
    email: string,
    fullName: string,
    avatarUrl?: string,
  ) {
    return this.prisma.user.create({
      data: {
        email,
        fullName,
        avatarUrl,
      },
    });
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

    const canSendResetEmail = await this.reservePasswordResetEmailSlot(user.id);
    if (!canSendResetEmail) {
      return;
    }

    const resetToken = randomUUID();
    const tokenHash = this.hashResetCode(resetToken);
    const expiresInMinutes = this.getResetCodeExpiryMinutes();
    const expiresInSeconds = expiresInMinutes * 60;
    const clientUrl =
      this.configService.get<string>('CLIENT_URL') || 'http://localhost:5173';
    const normalizedClientUrl = clientUrl.replace(/\/$/, '');
    const resetLink = `${normalizedClientUrl}/auth/reset-password?token=${encodeURIComponent(
      resetToken,
    )}`;

    await this.storePasswordResetToken(user.id, tokenHash, expiresInSeconds);

    const mail = resetPasswordTemplate(
      user.fullName,
      resetLink,
      expiresInMinutes,
    );

    await this.mailJobQueueService.enqueue({
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

    const userId = await this.consumePasswordResetToken(incomingTokenHash);

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
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

  private async verifyFirebaseIdToken(idToken: string) {
    const [encodedHeader, encodedPayload, encodedSignature] =
      idToken.split('.');

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      throw new UnauthorizedException('Invalid Firebase token');
    }

    const header = this.parseBase64UrlJson<FirebaseJwtHeader>(encodedHeader);
    const payload =
      this.parseBase64UrlJson<FirebaseIdTokenPayload>(encodedPayload);
    const projectId = this.getFirebaseProjectId();
    const now = Math.floor(Date.now() / 1000);

    if (header.alg !== 'RS256' || !header.kid) {
      throw new UnauthorizedException('Invalid Firebase token header');
    }

    this.assertValidFirebaseClaims(payload, projectId, now);

    const certs = await this.getFirebasePublicCerts();
    const cert = certs[header.kid];

    if (!cert) {
      throw new UnauthorizedException('Unknown Firebase token key');
    }

    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    verifier.end();

    const isValid = verifier.verify(
      cert,
      Buffer.from(encodedSignature, 'base64url'),
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid Firebase token signature');
    }

    return payload;
  }

  private parseBase64UrlJson<T>(value: string): T {
    try {
      return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
    } catch {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  private assertValidFirebaseClaims(
    payload: FirebaseIdTokenPayload,
    projectId: string,
    now: number,
  ) {
    const expectedIssuer = `https://securetoken.google.com/${projectId}`;

    if (payload.aud !== projectId) {
      throw new UnauthorizedException(
        `Invalid Firebase token audience. Expected ${projectId}, received ${payload.aud || 'missing'}`,
      );
    }

    if (payload.iss !== expectedIssuer) {
      throw new UnauthorizedException(
        `Invalid Firebase token issuer. Expected ${expectedIssuer}, received ${payload.iss || 'missing'}`,
      );
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid Firebase token subject');
    }

    if (!payload.iat || !payload.exp) {
      throw new UnauthorizedException('Invalid Firebase token timestamps');
    }

    if (payload.iat > now + 300) {
      throw new UnauthorizedException(
        'Firebase token was issued in the future. Check server clock.',
      );
    }

    if (payload.exp <= now - 300) {
      throw new UnauthorizedException(
        'Firebase token is expired. Check server clock or sign in again.',
      );
    }
  }

  private async getFirebasePublicCerts() {
    if (
      this.firebaseCertCache &&
      this.firebaseCertCache.expiresAt > Date.now()
    ) {
      return this.firebaseCertCache.certs;
    }

    const response = await fetch(FIREBASE_CERTS_URL);

    if (!response.ok) {
      throw new UnauthorizedException('Unable to verify Firebase token');
    }

    const cacheControl = response.headers.get('cache-control') || '';
    const maxAgeSeconds = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 0);
    const certs = (await response.json()) as Record<string, string>;

    this.firebaseCertCache = {
      certs,
      expiresAt: Date.now() + Math.max(maxAgeSeconds, 60) * 1000,
    };

    return certs;
  }

  private getFirebaseProjectId() {
    return (
      this.configService.get<string>('FIREBASE_PROJECT_ID') ||
      this.configService.get<string>('firebase.projectId') ||
      'task-management-system-gg'
    );
  }

  private hashResetCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }

  private getPasswordResetTokenKey(tokenHash: string) {
    return `${PASSWORD_RESET_TOKEN_PREFIX}:${tokenHash}`;
  }

  private getPasswordResetUserKey(userId: string) {
    return `${PASSWORD_RESET_USER_PREFIX}:${userId}`;
  }

  private getPasswordResetCooldownKey(userId: string) {
    return `${PASSWORD_RESET_COOLDOWN_PREFIX}:${userId}`;
  }

  private async reservePasswordResetEmailSlot(userId: string) {
    const result = await this.redis.set(
      this.getPasswordResetCooldownKey(userId),
      '1',
      'EX',
      PASSWORD_RESET_EMAIL_COOLDOWN_SECONDS,
      'NX',
    );

    return result === 'OK';
  }

  private async storePasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresInSeconds: number,
  ) {
    const userKey = this.getPasswordResetUserKey(userId);
    const previousTokenHash = await this.redis.get(userKey);

    const pipeline = this.redis.pipeline();

    if (previousTokenHash) {
      pipeline.del(this.getPasswordResetTokenKey(previousTokenHash));
    }

    pipeline.set(userKey, tokenHash, 'EX', expiresInSeconds);
    pipeline.set(
      this.getPasswordResetTokenKey(tokenHash),
      userId,
      'EX',
      expiresInSeconds,
    );

    await pipeline.exec();
  }

  private async consumePasswordResetToken(tokenHash: string) {
    const tokenKey = this.getPasswordResetTokenKey(tokenHash);
    const userId = await this.redis.get(tokenKey);

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const userKey = this.getPasswordResetUserKey(userId);
    const activeTokenHash = await this.redis.get(userKey);

    if (activeTokenHash !== tokenHash) {
      await this.redis.del(tokenKey);
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.redis.del(tokenKey, userKey);

    return userId;
  }

  private getResetCodeExpiryMinutes() {
    const rawValue =
      this.configService.get<string>('RESET_PASSWORD_CODE_EXPIRES_MINUTES') ??
      '15';
    const value = Number(rawValue);

    if (!Number.isInteger(value) || value <= 0) {
      return 15;
    }

    return value;
  }
}
