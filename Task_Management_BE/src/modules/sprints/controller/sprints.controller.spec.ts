import { SprintsController } from './sprints.controller';

describe('SprintsController', () => {
  it('forwards sprint CRUD calls with current user id', () => {
    const service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const controller = new SprintsController(service as any);
    const req = { user: { id: 'user-1' } };

    controller.create(req, { name: 'Sprint 1' } as any);
    controller.findAll(req, { page: 1 } as any);
    controller.findOne(req, 'sprint-1');
    controller.update(req, 'sprint-1', { name: 'Sprint 2' } as any);
    controller.remove(req, 'sprint-1');

    expect(service.create).toHaveBeenCalledWith('user-1', { name: 'Sprint 1' });
    expect(service.findAll).toHaveBeenCalledWith('user-1', { page: 1 });
    expect(service.findOne).toHaveBeenCalledWith('user-1', 'sprint-1');
    expect(service.update).toHaveBeenCalledWith('user-1', 'sprint-1', { name: 'Sprint 2' });
    expect(service.remove).toHaveBeenCalledWith('user-1', 'sprint-1');
  });
});
