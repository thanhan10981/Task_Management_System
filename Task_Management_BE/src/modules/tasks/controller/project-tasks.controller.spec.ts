import { ProjectTasksController } from './project-tasks.controller';

describe('ProjectTasksController', () => {
  it('forwards project scoped AI and task creation calls', () => {
    const aiService = { generateTaskDraft: jest.fn() };
    const taskService = { create: jest.fn() };
    const controller = new ProjectTasksController(aiService as any, taskService as any);
    const req = { user: { id: 'user-1' } };

    controller.generateTaskDraft(req, 'project-1', { prompt: 'Build login' } as any);
    expect(aiService.generateTaskDraft).toHaveBeenCalledWith('user-1', 'project-1', 'Build login');

    controller.createProjectTask(req, 'project-1', { title: 'Task' } as any);
    expect(taskService.create).toHaveBeenCalledWith('user-1', { title: 'Task', projectId: 'project-1' });
  });
});
