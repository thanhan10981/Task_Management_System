import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let configService: any;
  let mailJobQueueService: any;
  let redis: any;
  let pipeline: any;

  const user = {
    id: 'user-1',
    email: 'ada@example.com',
    fullName: 'Ada Lovelace',
    passwordHash: 'hashed-password',
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token'),
      verify: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'jwt.secret': 'access-secret',
          'jwt.refreshSecret': 'refresh-secret',
          'jwt.expiresIn': '1h',
          'jwt.refreshExpiresIn': '14d',
          CLIENT_URL: 'http://client.test/',
          RESET_PASSWORD_CODE_EXPIRES_MINUTES: '15',
        };
        return values[key];
      }),
    };
    mailJobQueueService = { enqueue: jest.fn().mockResolvedValue(undefined) };
    pipeline = {
      del: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
      pipeline: jest.fn(() => pipeline),
    };

    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    service = new AuthService(prisma, jwtService, configService, mailJobQueueService, redis);
  });

  it('registers a new user and returns tokens without passwordHash', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);

    const result = await service.register({
      email: user.email,
      fullName: user.fullName,
      password: 'secret',
      confirmPassword: 'secret',
    } as any);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: user.email,
        fullName: user.fullName,
        passwordHash: 'new-hash',
      },
    });
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: user.id, email: user.email, fullName: user.fullName },
    });
  });

  it('rejects registration when passwords do not match or email exists', async () => {
    await expect(
      service.register({
        email: user.email,
        fullName: user.fullName,
        password: 'a',
        confirmPassword: 'b',
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.user.findUnique.mockResolvedValue(user);
    await expect(
      service.register({
        email: user.email,
        fullName: user.fullName,
        password: 'secret',
        confirmPassword: 'secret',
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with a valid password and rejects invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.login({ email: user.email, password: 'secret' } as any)).resolves.toMatchObject({
      accessToken: 'access-token',
      user: { id: user.id },
    });

    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login({ email: user.email, password: 'secret' } as any)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    prisma.user.findUnique.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.login({ email: user.email, password: 'wrong' } as any)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refreshes tokens using the remaining refresh-token lifetime', async () => {
    const exp = Math.floor(Date.now() / 1000) + 300;
    jwtService.verify.mockReturnValue({ sub: user.id, email: user.email, exp });
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.refreshToken('refresh-token')).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: user.id },
    });
    expect(jwtService.signAsync).toHaveBeenLastCalledWith(
      { sub: user.id, email: user.email },
      expect.objectContaining({ expiresIn: expect.any(Number) }),
    );
  });

  it('rejects invalid refresh tokens', async () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('bad token');
    });

    await expect(service.refreshToken('bad')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('sends forgot-password mail only when user exists and cooldown is open', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    });
    redis.get.mockResolvedValue(null);

    await service.forgotPassword({ email: user.email } as any);

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('auth:password-reset:cooldown'),
      '1',
      'EX',
      60,
      'NX',
    );
    expect(mailJobQueueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: expect.any(String),
        html: expect.stringContaining('/auth/reset-password?token='),
      }),
    );

    mailJobQueueService.enqueue.mockClear();
    prisma.user.findUnique.mockResolvedValue(null);
    await service.forgotPassword({ email: 'missing@example.com' } as any);
    expect(mailJobQueueService.enqueue).not.toHaveBeenCalled();
  });

  it('resets password and consumes the active reset token', async () => {
    const resetToken = 'reset-token';
    const tokenHash = createHash('sha256').update(resetToken).digest('hex');
    redis.get.mockResolvedValueOnce(user.id).mockResolvedValueOnce(tokenHash);

    await service.resetPassword({
      resetToken,
      newPassword: 'new-secret',
      confirmPassword: 'new-secret',
    } as any);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { passwordHash: 'new-hash' },
    });
    expect(redis.del).toHaveBeenCalledWith(
      `auth:password-reset:token:${tokenHash}`,
      `auth:password-reset:user:${user.id}`,
    );
  });

  it('rejects reset when passwords mismatch or token is missing', async () => {
    await expect(
      service.resetPassword({
        resetToken: 'token',
        newPassword: 'a',
        confirmPassword: 'b',
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);

    redis.get.mockResolvedValue(null);
    await expect(
      service.resetPassword({
        resetToken: 'token',
        newPassword: 'a',
        confirmPassword: 'a',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
