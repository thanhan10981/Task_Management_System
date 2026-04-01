import { del, post, put } from '@/api/client'
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/task.schema'

const BASE = '/tasks'

export const taskService = {
  createTask: (data: CreateTaskInput) => post(BASE, data),
  updateTask: (id: string, data: UpdateTaskInput) => put(`${BASE}/${id}`, data),
  deleteTask: (id: string) => del(`${BASE}/${id}`),
}
