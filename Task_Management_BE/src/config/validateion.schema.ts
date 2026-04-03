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
  };
}
