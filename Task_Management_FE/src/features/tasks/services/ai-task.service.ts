import { post } from '@/api/client'

export type AiTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface AiSuggestedSubtask {
  title: string
  description: string
}

export interface AiTaskDraft {
  title: string
  description: string
  behavior: string
  acceptanceCriteria: string[]
  priority: AiTaskPriority
  suggestedSubtasks: AiSuggestedSubtask[]
}

const PROMPT_MAX_LENGTH = 4000

export function promptMaxLength() {
  return PROMPT_MAX_LENGTH
}

export async function generateAiTaskDraft(projectId: string, prompt: string) {
  return post<AiTaskDraft | { data?: AiTaskDraft }>(
    `/projects/${projectId}/ai/generate-task`,
    { prompt }
  ).then((response) => {
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as AiTaskDraft
    }

    return response as AiTaskDraft
  })
}

export async function generateAiTaskDescription(title: string, description: string) {
  return post<{ markdown: string } | { data?: { markdown: string } }>(
    '/tasks/ai/generate-description',
    { title, description }
  ).then((response) => {
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data?.markdown ?? ''
    }

    return (response as { markdown: string }).markdown
  })
}

export function buildAiTaskDescriptionMarkdown(
  description: string,
  behavior: string,
  acceptanceCriteria: string[]
) {
  const criteria = acceptanceCriteria
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join('\n')

  return [
    description.trim(),
    '## Behavior',
    behavior.trim(),
    '## Acceptance Criteria',
    criteria,
  ]
    .filter((part) => part.length > 0)
    .join('\n\n')
}
