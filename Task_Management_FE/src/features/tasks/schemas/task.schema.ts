import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────
export const TaskStatusEnum = z.enum(['todo', 'in_progress', 'done', 'cancelled'])
export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'])

export type TaskStatus = z.infer<typeof TaskStatusEnum>
export type TaskPriority = z.infer<typeof TaskPriorityEnum>

// ─── Task Schema ──────────────────────────────────────────────────────────────
export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  description: z.string().optional(),
  status: TaskStatusEnum,
  priority: TaskPriorityEnum,
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Task = z.infer<typeof taskSchema>

// ─── Form Schemas ─────────────────────────────────────────────────────────────
export const createTaskSchema = taskSchema.pick({
  title: true,
  description: true,
  priority: true,
  dueDate: true,
}).extend({
  projectId: z.string().uuid(),
  statusId: z.string().uuid(),
  assigneeIds: z.array(z.string().uuid()).optional(),
})

export const updateTaskSchema = createTaskSchema.partial()

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
