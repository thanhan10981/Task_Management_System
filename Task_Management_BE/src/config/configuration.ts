// src/config/configuration.ts
export default () => ({
  nodeEnv: process?.env?.NODE_ENV || 'development',
  port: parseInt(process?.env?.PORT ?? '3001', 10),

  database: {
    url: process?.env?.DATABASE_URL,
    user: process?.env?.DB_USER,
    password: process?.env?.DB_PASSWORD,
    name: process?.env?.DB_NAME,
  },

  jwt: {
    secret: process?.env?.JWT_SECRET,
    refreshSecret: process?.env?.JWT_REFRESH_SECRET,
    expiresIn: process?.env?.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process?.env?.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  clientUrl: process?.env?.CLIENT_URL || 'http://localhost:3000',
});