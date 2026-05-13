import { TasksController } from './tasks.controller';

describe('TasksController', () => {
  let controller: TasksController;
  let taskService: any;
  let assigneeService: any;
  let statusService: any;
  let aiService: any;
  const req = { user: { id: 'user-1' } };

  beforeEach(() => {
    taskService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByParentTask: jest.fn(),
      listProjectGroups: jest.fn(),
      createProjectGroup: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      restore: jest.fn(),
      remove: jest.fn(),
      getHistory: jest.fn(),
    };
    assigneeService = {
      listAssignees: jest.fn(),
      assignUser: jest.fn(),
      unassignUser: jest.fn(),
    };
    statusService = {
      listStatuses: jest.fn(),
      createStatus: jest.fn(),
      updateStatus: jest.fn(),
      removeStatus: jest.fn(),
    };
    aiService = {
      generateTaskDescription: jest.fn(),
    };
    controller = new TasksController(taskService, assigneeService, statusService, aiService);
  });

  it('forwards task and AI calls', () => {
    controller.generateDescription({ title: 'Task', description: 'Details' } as any);
    controller.create(req, { title: 'Task' } as any);
    controller.findAll(req, { page: 1 } as any);
    controller.findByParentTask(req, 'parent-1', { limit: 5 } as any);
    controller.findOne(req, 'task-1');
    controller.update(req, 'task-1', { title: 'New' } as any);
    controller.restore(req, 'task-1');
    controller.remove(req, 'task-1');
    controller.getHistory(req, 'task-1', { page: 1 } as any);

    expect(aiService.generateTaskDescription).toHaveBeenCalledWith('Task', 'Details');
    expect(taskService.create).toHaveBeenCalledWith('user-1', { title: 'Task' });
    expect(taskService.findAll).toHaveBeenCalledWith('user-1', { page: 1 });
    expect(taskService.findByParentTask).toHaveBeenCalledWith('user-1', 'parent-1', { limit: 5 });
    expect(taskService.findOne).toHaveBeenCalledWith('user-1', 'task-1');
    expect(taskService.update).toHaveBeenCalledWith('user-1', 'task-1', { title: 'New' });
    expect(taskService.restore).toHaveBeenCalledWith('user-1', 'task-1');
    expect(taskService.remove).toHaveBeenCalledWith('user-1', 'task-1');
    expect(taskService.getHistory).toHaveBeenCalledWith('user-1', 'task-1', { page: 1 });
  });

  it('forwards group, status, and assignee calls', () => {
    controller.listGroups(req, 'project-1');
    controller.createGroup(req, 'project-1', { name: 'API' } as any);
    controller.listStatuses(req, 'project-1');
    controller.createStatus(req, 'project-1', { name: 'QA' } as any);
    controller.updateStatus(req, 'project-1', 'status-1', { name: 'Done' } as any);
    controller.removeStatus(req, 'project-1', 'status-1');
    controller.listAssignees(req, 'task-1');
    controller.assignUser(req, 'task-1', { userId: 'user-2' } as any);
    controller.unassignUser(req, 'task-1', 'user-2');

    expect(taskService.listProjectGroups).toHaveBeenCalledWith('user-1', 'project-1');
    expect(taskService.createProjectGroup).toHaveBeenCalledWith('user-1', 'project-1', { name: 'API' });
    expect(statusService.listStatuses).toHaveBeenCalledWith('user-1', 'project-1');
    expect(statusService.createStatus).toHaveBeenCalledWith('user-1', 'project-1', { name: 'QA' });
    expect(statusService.updateStatus).toHaveBeenCalledWith('user-1', 'project-1', 'status-1', { name: 'Done' });
    expect(statusService.removeStatus).toHaveBeenCalledWith('user-1', 'project-1', 'status-1');
    expect(assigneeService.listAssignees).toHaveBeenCalledWith('user-1', 'task-1');
    expect(assigneeService.assignUser).toHaveBeenCalledWith('user-1', 'task-1', { userId: 'user-2' });
    expect(assigneeService.unassignUser).toHaveBeenCalledWith('user-1', 'task-1', 'user-2');
  });
});
