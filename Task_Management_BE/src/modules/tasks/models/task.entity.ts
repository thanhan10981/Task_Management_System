// Task entity type definition for Prisma
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string; // TO_DO | IN_PROGRESS | DONE
  priority: string; // LOW | MEDIUM | HIGH
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user?: any; // Optional user relation
}

export enum TaskStatus {
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}
