export default () => ({
  // Application
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  appName: process.env.APP_NAME || 'Nexaplay',

  // Database
  database: {
    provider: process.env.DB_PROVIDER || 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: process.env.DB_LOGGING || false,
    entities: [__dirname + '/../database/entities/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    subscribers: [__dirname + '/../database/subscribers/*.subscriber{.ts,.js}'],
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true' || false,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
    secure: process.env.SMTP_SECURE || false,
  },

  redis: {
    host: process.env.REDIS_HOST,
    auth: process.env.REDIS_AUTH || false,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    namespace: process.env.REDIS_NAMESPACE,
  },

  logging: {
    console: process.env.APP_CONSOLE_LOG_LEVEL || 'trace',
    file: process.env.APP_FILE_LOG_LEVEL || 'trace',
    telegram: process.env.APP_TELEGRAM_LOG_LEVEL || 'error',
    threads: process.env.APP_TELEGRAM_THREADS || false,
    threadId: process.env.APP_TELEGRAM_THREAD_ID,
    botToken: process.env.APP_TELEGRAM_BOT_TOKEN,
    chatId: process.env.APP_TELEGRAM_CHAT_ID,
  },

  links: {
    frontend: process.env.FRONTEND_URL,
    backend: process.env.BACKEND_URL,
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    endpoint: process.env.STORAGE_ENDPOINT,
    port: parseInt(process.env.STORAGE_PORT, 10) || 9000,
    useSSL: process.env.STORAGE_USE_SSL || false,
    accessKey: process.env.STORAGE_ACCESS_KEY,
    keySecret: process.env.STORAGE_KEY_SECRET,
    bucket: process.env.STORAGE_BUCKET,
    publicUrl: process.env.STORAGE_PUBLIC_URL,
    defaultRegion: process.env.STORAGE_DEFAULT_REGION,
  },
});
