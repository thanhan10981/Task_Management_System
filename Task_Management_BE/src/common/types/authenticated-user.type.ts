export interface AuthenticatedUser {
  id: string;
  email?: string;
  fullName?: string;
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
}
