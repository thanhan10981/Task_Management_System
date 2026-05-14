import { UserController } from './user.controller';

describe('UserController', () => {
  it('forwards user CRUD calls', async () => {
    const service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn().mockResolvedValue({ success: true }),
    };
    const controller = new UserController(service as any);

    controller.create({ email: 'a@test.com' } as any);
    controller.findAll({ page: 1 } as any);
    controller.findOne('user-1');
    controller.update('user-1', { fullName: 'Ada' } as any);
    await controller.remove('user-1');

    expect(service.create).toHaveBeenCalledWith({ email: 'a@test.com' });
    expect(service.findAll).toHaveBeenCalledWith({ page: 1 });
    expect(service.findOne).toHaveBeenCalledWith('user-1');
    expect(service.update).toHaveBeenCalledWith('user-1', { fullName: 'Ada' });
    expect(service.remove).toHaveBeenCalledWith('user-1');
  });
});
