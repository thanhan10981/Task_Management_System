import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user.service';

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let prisma: any;
  const user = {
    id: 'user-1',
    email: 'ada@example.com',
    fullName: 'Ada',
    passwordHash: 'hash',
    userSettings: null,
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      project: { count: jest.fn() },
      projectMember: { count: jest.fn() },
      task: { count: jest.fn() },
      taskAssignee: { count: jest.fn() },
      comment: { count: jest.fn() },
      file: { count: jest.fn() },
      sprint: { count: jest.fn() },
      $transaction: jest.fn(),
    };
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
    service = new UserService(prisma);
  });

  it('creates a user without returning passwordHash', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);

    await expect(
      service.create({ email: user.email, fullName: user.fullName, password: 'secret' } as any),
    ).resolves.toEqual({ id: user.id, email: user.email, fullName: user.fullName, userSettings: null });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ passwordHash: 'new-hash' }) }),
    );
  });

  it('rejects duplicate create and missing findOne', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    await expect(service.create({ email: user.email } as any)).rejects.toBeInstanceOf(ConflictException);

    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists users with search pagination and strips passwordHash', async () => {
    prisma.user.findMany.mockResolvedValue([user]);
    prisma.user.count.mockResolvedValue(1);

    await expect(service.findAll({ page: 1, limit: 10, search: 'ada' } as any)).resolves.toEqual({
      data: [{ id: user.id, email: user.email, fullName: user.fullName, userSettings: null }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  });

  it('updates a user and rejects duplicate update email', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(user).mockResolvedValueOnce({ id: 'other' });

    await expect(service.update(user.id, { email: 'other@example.com' } as any)).rejects.toBeInstanceOf(
      ConflictException,
    );

    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue({ ...user, fullName: 'Grace' });

    await expect(service.update(user.id, { fullName: 'Grace' } as any)).resolves.toMatchObject({
      fullName: 'Grace',
    });
  });

  it('deletes users only when no related records exist', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.$transaction.mockResolvedValue([0, 0, 0, 0, 0, 0, 0]);

    await expect(service.remove(user.id)).resolves.toEqual({ success: true });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: user.id } });

    prisma.$transaction.mockResolvedValue([1, 0, 0, 0, 0, 0, 0]);
    await expect(service.remove(user.id)).rejects.toBeInstanceOf(ConflictException);
  });
});
