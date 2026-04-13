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
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  MAIL_PUBLIC_FROM_NAME?: string;
  MAIL_PUBLIC_FROM_ADDRESS?: string;
  REMINDER_THRESHOLDS_MINUTES?: string;
  RESET_PASSWORD_CODE_EXPIRES_MINUTES?: number;
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

function isPersonalMailbox(email: string): boolean {
  return /@(gmail\.com|outlook\.com|hotmail\.com|yahoo\.com|icloud\.com)$/i.test(email);
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

export function validate(config: RawConfig): EnvVariables {
  const nodeEnv = readString(config, 'NODE_ENV', 'development');

  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, production, test');
  }

  const databaseUrl = readString(config, 'DATABASE_URL');
  const jwtSecret = readString(config, 'JWT_SECRET');
  const jwtRefreshSecret = readString(config, 'JWT_REFRESH_SECRET');

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
  const mailPublicFromName = readString(config, 'MAIL_PUBLIC_FROM_NAME') || 'Task Management';
  const mailPublicFromAddress =
    readString(config, 'MAIL_PUBLIC_FROM_ADDRESS') || 'no-reply@task.local';
  const publicFromEmail = parseEmailAddress(mailPublicFromAddress);
  const smtpUserEmail = parseEmailAddress(smtpUser);

  const isSmtpConfigured = Boolean(smtpHost || smtpUser || smtpPass);
  if (isSmtpConfigured && (!smtpHost || !smtpUser || !smtpPass)) {
    throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASS must all be provided together');
  }

  if (nodeEnv === 'production' && smtpUserEmail) {
    if (isPersonalMailbox(smtpUserEmail)) {
      throw new Error(
        'SMTP_USER must not be a personal mailbox in production. Use a dedicated no-reply mailbox.',
      );
    }

    if (publicFromEmail && smtpUserEmail !== publicFromEmail) {
      throw new Error(
        'MAIL_PUBLIC_FROM_ADDRESS must match SMTP_USER in production to prevent provider rewrite and sender leakage.',
      );
    }
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
    SMTP_HOST: smtpHost,
    SMTP_PORT: config.SMTP_PORT ? readNumber(config, 'SMTP_PORT', 587) : undefined,
    SMTP_USER: smtpUser,
    SMTP_PASS: smtpPass,
    SMTP_FROM: readString(config, 'SMTP_FROM') || undefined,
    MAIL_PUBLIC_FROM_NAME: mailPublicFromName,
    MAIL_PUBLIC_FROM_ADDRESS: mailPublicFromAddress,
    REMINDER_THRESHOLDS_MINUTES:
      readString(config, 'REMINDER_THRESHOLDS_MINUTES') || undefined,
    RESET_PASSWORD_CODE_EXPIRES_MINUTES: config.RESET_PASSWORD_CODE_EXPIRES_MINUTES
      ? readNumber(config, 'RESET_PASSWORD_CODE_EXPIRES_MINUTES', 15)
      : undefined,
  };
}
