import { post } from './client'

export type FeedbackType = 'ui' | 'bug' | 'feature' | 'other'

export interface SubmitFeedbackPayload {
  type: FeedbackType
  subject?: string
  message: string
  pageUrl?: string
  projectId?: string
  projectName?: string
  clientInfo?: string
}

export function submitFeedback(payload: SubmitFeedbackPayload) {
  return post('/feedback', payload)
}
