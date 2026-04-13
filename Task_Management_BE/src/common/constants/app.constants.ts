export const DEFAULT_MAIL_FROM_NAME =
  process.env.MAIL_PUBLIC_FROM_NAME?.trim() || 'Task Management';

export const DEFAULT_MAIL_FROM_ADDRESS =
  process.env.MAIL_PUBLIC_FROM_ADDRESS?.trim() || 'no-reply@task.local';

export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export const DEFAULT_CLOUDINARY_ALLOWED_PREFIXES = ['tasks', 'projects', 'avatars'];

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/plain',
]);

export const SAFE_USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  avatarUrl: true,
  coverUrl: true,
  jobTitle: true,
  phone: true,
  bio: true,
  createdAt: true,
  updatedAt: true,
};