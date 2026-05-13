import { buildTaskDescriptionPrompt, buildTaskDraftPrompt } from './ai-task.prompts';

describe('ai-task.prompts', () => {
  it('builds a JSON-only task draft prompt with user and project context', () => {
    const prompt = buildTaskDraftPrompt('Create login', '{"name":"Octom"}');

    expect(prompt).toContain('Create login');
    expect(prompt).toContain('"name":"Octom"');
    expect(prompt).toContain('Return JSON only');
    expect(prompt).toContain('"suggestedSubtasks"');
  });

  it('builds a markdown task description prompt', () => {
    const prompt = buildTaskDescriptionPrompt('Login', 'Use cookies');

    expect(prompt).toContain('Login');
    expect(prompt).toContain('Use cookies');
    expect(prompt).toContain('## Acceptance Criteria');
    expect(prompt).toContain('Return markdown only');
  });
});
