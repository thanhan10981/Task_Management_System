export const NOTIFICATION_PREFERENCE_KEYS = {
  taskAssigned: 'task-assign',
  comments: 'comments',
  reminders: 'reminders',
  teamActivity: 'team-update',
  project: 'project',
  mentions: 'mentions',
} as const;

export type NotificationPreferenceKey =
  (typeof NOTIFICATION_PREFERENCE_KEYS)[keyof typeof NOTIFICATION_PREFERENCE_KEYS];
