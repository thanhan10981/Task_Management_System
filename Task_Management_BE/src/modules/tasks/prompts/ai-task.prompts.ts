export function buildTaskDraftPrompt(
  userPrompt: string,
  projectContext: string,
): string {
  return `You are an AI assistant inside a software task management system.
Your job is to convert a user's rough requirement into a structured software task.

Return JSON only. Do not include markdown outside JSON.

User requirement:
"${userPrompt}"

Project context:
"${projectContext}"

Output format:
{
  "title": "Short task title",
  "description": "Clear task description",
  "behavior": "Expected user/system behavior",
  "acceptanceCriteria": [
    "Testable condition 1",
    "Testable condition 2",
    "Testable condition 3"
  ],
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "suggestedSubtasks": [
    {
      "title": "Subtask title",
      "description": "Subtask description"
    }
  ]
}

Rules:
- Use the same language as the user's input.
- Title must be short and action-oriented.
- Description must explain what needs to be built.
- Behavior must describe how the feature should behave.
- Acceptance criteria must be concrete and testable.
- Suggested subtasks should be practical development steps.
- Do not invent unrelated features.
- Do not include assignees unless the user explicitly mentions people.
- Priority must be LOW, MEDIUM, HIGH, or URGENT.
- Return 3 to 7 acceptance criteria.
- Return 2 to 6 suggested subtasks.
- JSON only.`;
}

export function buildTaskDescriptionPrompt(
  title: string,
  description: string,
): string {
  return `You are an AI assistant inside a software project management system.

Generate:
- improved task description
- behavior
- acceptance criteria
- suggested subtasks

Return markdown only.

Task title:
"${title}"

Current description:
"${description}"

Rules:
- Use same language as user input.
- Keep output practical and software-focused.
- Acceptance criteria must be testable.
- Suggested subtasks should be implementation steps.
- Avoid generic filler text.
- Do not wrap the output in code fences.
- Use this markdown structure:

[Improved task description]

## Behavior
...

## Acceptance Criteria
- ...
- ...

## Suggested Subtasks
- ...
- ...`;
}
