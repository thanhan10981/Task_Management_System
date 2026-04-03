// User entity type definition for Prisma
export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
