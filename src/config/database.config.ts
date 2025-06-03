import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getDatabaseOptimizationConfig } from './database-optimization.config';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const databaseUrl = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Database configuration:', {
    isProduction,
    hasUrl: !!databaseUrl,
    urlStart: databaseUrl.substring(0, 20) + '...',
  });

  const baseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    url: databaseUrl,
    // Use autoLoadEntities to avoid entity conflicts and reduce serialization time
    autoLoadEntities: true,
    synchronize: false,
    migrations: ['dist/migrations/*-migrations.js', 'dist/src/migrations/*.js'],
    logging: isProduction ? ['error', 'warn'] : false,
    retryAttempts: isProduction ? 10 : 3,
    retryDelay: isProduction ? 3000 : 1000,
    extra: {
      ssl: {
        rejectUnauthorized: false,
      },
      // Basic connection settings
      connectionTimeoutMillis: 15000,
      max: isProduction ? 20 : 10,
      min: isProduction ? 5 : 2,
    },
  };

  // Apply optimization configuration for production
  return isProduction ? getDatabaseOptimizationConfig(baseConfig) : baseConfig;
};
