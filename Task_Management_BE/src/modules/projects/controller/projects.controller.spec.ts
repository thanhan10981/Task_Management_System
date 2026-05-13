import { ProjectsController } from './projects.controller';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: any;
  const req = { user: { id: 'user-1' } };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      listMembers: jest.fn(),
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      joinProject: jest.fn(),
      leaveProject: jest.fn(),
      createInviteToken: jest.fn(),
      addMember: jest.fn(),
      updateMemberRole: jest.fn(),
      removeMember: jest.fn(),
    };
    controller = new ProjectsController(service);
  });

  it('forwards project CRUD calls with current user id', () => {
    controller.create(req, { name: 'Octom' } as any);
    expect(service.create).toHaveBeenCalledWith('user-1', { name: 'Octom' });

    controller.findAll(req, { page: 1 } as any);
    expect(service.findAll).toHaveBeenCalledWith('user-1', { page: 1 });

    controller.findOne(req, 'project-1');
    expect(service.findOne).toHaveBeenCalledWith('user-1', 'project-1');

    controller.update(req, 'project-1', { name: 'New' } as any);
    expect(service.update).toHaveBeenCalledWith('user-1', 'project-1', { name: 'New' });

    controller.remove(req, 'project-1');
    expect(service.remove).toHaveBeenCalledWith('user-1', 'project-1');
  });

  it('forwards member/settings/invite calls', () => {
    controller.listMembers(req, 'project-1');
    controller.getSettings(req, 'project-1');
    controller.updateSettings(req, 'project-1', { rolePermissions: {} } as any);
    controller.joinProject(req, 'project-1', { token: 'abc' } as any);
    controller.leaveProject(req, 'project-1');
    controller.createInviteToken(req, 'project-1');
    controller.addMember(req, 'project-1', { userId: 'user-2' } as any);
    controller.updateMemberRole(req, 'project-1', 'user-2', { role: 'ADMIN' } as any);
    controller.removeMember(req, 'project-1', 'user-2');

    expect(service.listMembers).toHaveBeenCalledWith('user-1', 'project-1');
    expect(service.getSettings).toHaveBeenCalledWith('user-1', 'project-1');
    expect(service.updateSettings).toHaveBeenCalledWith('user-1', 'project-1', { rolePermissions: {} });
    expect(service.joinProject).toHaveBeenCalledWith('user-1', 'project-1', { token: 'abc' });
    expect(service.leaveProject).toHaveBeenCalledWith('user-1', 'project-1');
    expect(service.createInviteToken).toHaveBeenCalledWith('user-1', 'project-1');
    expect(service.addMember).toHaveBeenCalledWith('user-1', 'project-1', { userId: 'user-2' });
    expect(service.updateMemberRole).toHaveBeenCalledWith('user-1', 'project-1', 'user-2', { role: 'ADMIN' });
    expect(service.removeMember).toHaveBeenCalledWith('user-1', 'project-1', 'user-2');
  });
});
