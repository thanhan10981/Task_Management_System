// User entity type definition for Prisma
export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
