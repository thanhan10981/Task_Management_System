type RawConfig = Record<string, unknown>;

export interface EnvVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CLIENT_URL?: string;
  RESEND_API_KEY?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_SECURE?: boolean;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  MAIL_PUBLIC_FROM_NAME?: string;
  MAIL_PUBLIC_FROM_ADDRESS?: string;
  FEEDBACK_RECIPIENT_EMAIL?: string;
  REMINDER_THRESHOLDS_MINUTES?: string;
  RESET_PASSWORD_CODE_EXPIRES_MINUTES?: number;
  GEMINI_API_KEY?: string;
  GEMINI_FALLBACK_MODEL?: string;
  FIREBASE_PROJECT_ID?: string;
  REDIS_URL: string;
  MAIL_QUEUE_NAME: string;
}

function parseEmailAddress(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return undefined;
  }

  const addressInBrackets = normalizedValue.match(/<([^>]+)>/)?.[1]?.trim();
  const plainAddress =
    normalizedValue.includes('@') && !normalizedValue.includes('<')
      ? normalizedValue.replace(/^['\"]|['\"]$/g, '').trim()
      : undefined;

  return (addressInBrackets ?? plainAddress)?.toLowerCase();
}

function readString(config: RawConfig, key: string, fallback = ''): string {
  const value = config[key];

  if (typeof value === 'string') {
    return value;
  }

  if (value == null) {
    return fallback;
  }

  return String(value);
}

function readNumber(config: RawConfig, key: string, fallback: number): number {
  const rawValue = config[key];
  const value = Number(rawValue ?? fallback);

  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return value;
}

function readBoolean(config: RawConfig, key: string): boolean | undefined {
  const value = config[key];

  if (value == null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  if (['true', '1', 'yes'].includes(normalizedValue)) {
    return true;
  }

  if (['false', '0', 'no'].includes(normalizedValue)) {
    return false;
  }

  throw new Error(`Environment variable ${key} must be a valid boolean`);
}

export function validate(config: RawConfig): EnvVariables {
  const nodeEnv = readString(config, 'NODE_ENV', 'development');

  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, production, test');
  }

  const databaseUrl = readString(config, 'DATABASE_URL');
  const jwtSecret = readString(config, 'JWT_SECRET');
  const jwtRefreshSecret = readString(config, 'JWT_REFRESH_SECRET');
  const resendApiKey = readString(config, 'RESEND_API_KEY') || undefined;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required');
  }

  if (!jwtRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is required');
  }

  const smtpHost = readString(config, 'SMTP_HOST') || undefined;
  const smtpUser = readString(config, 'SMTP_USER') || undefined;
  const smtpPass = readString(config, 'SMTP_PASS') || undefined;
  const smtpFrom = readString(config, 'SMTP_FROM') || undefined;
  const mailPublicFromName =
    readString(config, 'MAIL_PUBLIC_FROM_NAME') || 'Task Management';
  const mailPublicFromAddress =
    readString(config, 'MAIL_PUBLIC_FROM_ADDRESS') ||
    smtpFrom ||
    smtpUser ||
    'onboarding@resend.dev';
  const publicFromEmail = parseEmailAddress(mailPublicFromAddress);

  if (nodeEnv === 'production' && !resendApiKey) {
    throw new Error(
      'RESEND_API_KEY is required in production so emails are actually delivered',
    );
  }

  if (!publicFromEmail) {
    throw new Error('MAIL_PUBLIC_FROM_ADDRESS must be a valid email address');
  }

  const redisUrl = readString(config, 'REDIS_URL');
  const mailQueueName = readString(config, 'MAIL_QUEUE_NAME');

  if (!redisUrl) {
    throw new Error('REDIS_URL is required');
  }

  if (!mailQueueName) {
    throw new Error('MAIL_QUEUE_NAME is required');
  }
  return {
    NODE_ENV: nodeEnv as EnvVariables['NODE_ENV'],
    PORT: readNumber(config, 'PORT', 3001),
    DATABASE_URL: databaseUrl,
    DB_USER: readString(config, 'DB_USER') || undefined,
    DB_PASSWORD: readString(config, 'DB_PASSWORD') || undefined,
    DB_NAME: readString(config, 'DB_NAME') || undefined,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: readString(config, 'JWT_EXPIRES_IN', '15m'),
    JWT_REFRESH_SECRET: jwtRefreshSecret,
    JWT_REFRESH_EXPIRES_IN: readString(config, 'JWT_REFRESH_EXPIRES_IN', '7d'),
    CLIENT_URL: readString(config, 'CLIENT_URL') || undefined,
    RESEND_API_KEY: resendApiKey,
    SMTP_HOST: smtpHost,
    SMTP_PORT: config.SMTP_PORT
      ? readNumber(config, 'SMTP_PORT', 587)
      : undefined,
    SMTP_SECURE: readBoolean(config, 'SMTP_SECURE'),
    SMTP_USER: smtpUser,
    SMTP_PASS: smtpPass,
    SMTP_FROM: smtpFrom,
    MAIL_PUBLIC_FROM_NAME: mailPublicFromName,
    MAIL_PUBLIC_FROM_ADDRESS: mailPublicFromAddress,
    FEEDBACK_RECIPIENT_EMAIL:
      readString(config, 'FEEDBACK_RECIPIENT_EMAIL') || undefined,
    REMINDER_THRESHOLDS_MINUTES:
      readString(config, 'REMINDER_THRESHOLDS_MINUTES') || undefined,
    RESET_PASSWORD_CODE_EXPIRES_MINUTES:
      config.RESET_PASSWORD_CODE_EXPIRES_MINUTES
        ? readNumber(config, 'RESET_PASSWORD_CODE_EXPIRES_MINUTES', 15)
        : undefined,
    GEMINI_API_KEY: readString(config, 'GEMINI_API_KEY') || undefined,
    GEMINI_FALLBACK_MODEL:
      readString(config, 'GEMINI_FALLBACK_MODEL') || undefined,
    FIREBASE_PROJECT_ID: readString(config, 'FIREBASE_PROJECT_ID') || undefined,
    REDIS_URL: redisUrl,
    MAIL_QUEUE_NAME: mailQueueName,
  };
}
