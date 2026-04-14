import dotenv from 'dotenv'
dotenv.config()

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  DB: {
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME     || 'fieldops',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
  },

  JWT_SECRET:           process.env.JWT_SECRET           || 'fieldops_jwt_secret_change_me',
  JWT_REFRESH_SECRET:   process.env.JWT_REFRESH_SECRET   || 'fieldops_refresh_secret_change_me',
  JWT_EXPIRES_IN:       process.env.JWT_EXPIRES_IN       || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
} as const
