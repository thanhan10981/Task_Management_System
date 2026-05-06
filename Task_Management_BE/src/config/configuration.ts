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
    expiresIn: process?.env?.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process?.env?.JWT_REFRESH_EXPIRES_IN || '14d',
  },

  cloudinary: {
    cloudName: process?.env?.CLOUDINARY_CLOUD_NAME,
    apiKey: process?.env?.CLOUDINARY_API_KEY,
    apiSecret: process?.env?.CLOUDINARY_API_SECRET,
    authTokenKey: process?.env?.CLOUDINARY_AUTH_TOKEN_KEY,
    authenticatedUrlTtlSeconds: parseInt(process?.env?.CLOUDINARY_AUTHENTICATED_URL_TTL_SECONDS ?? '300', 10),
  },

  clientUrl: process?.env?.CLIENT_URL || process?.env?.FRONTEND_URL || 'http://localhost:5173',

  redis: {
    host: process?.env?.REDIS_HOST,
    port: process?.env?.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
    password: process?.env?.REDIS_PASSWORD,
    db: process?.env?.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : undefined,
  },

  mailQueue: {
    name: process?.env?.MAIL_QUEUE_NAME,
  },
});
