import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Database optimization configuration for production environments
 * Addresses TypeORM serialization warnings and improves performance
 */
export const getDatabaseOptimizationConfig = (
  baseConfig: TypeOrmModuleOptions,
): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasRedis = process.env.REDIS_HOST && process.env.REDIS_PORT;

  // Build the configuration with conditional cache
  const cacheConfig = hasRedis
    ? {
        cache: {
          duration: 30000, // 30 seconds
          type: 'redis' as any,
          options: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT as string),
          },
        },
      }
    : {};

  const optimizedConfig: TypeOrmModuleOptions = {
    ...baseConfig,
    ...cacheConfig,
    // Performance optimizations
    extra: {
      ...baseConfig.extra,
      // Connection pool optimization
      max: isProduction ? 25 : 10,
      min: isProduction ? 5 : 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,

      // Query optimization
      statement_timeout: 30000,
      query_timeout: 30000,
      lock_timeout: 10000,

      // Connection optimization
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,

      // Performance settings
      application_name: 'superese-api',
      tcp_keepalives_idle: 600,
      tcp_keepalives_interval: 30,
      tcp_keepalives_count: 3,
    },

    // Logging optimization
    logging: isProduction ? ['error', 'warn', 'migration'] : false,

    // Entity loading optimization
    dropSchema: false,
    migrationsRun: false,

    // Connection optimization
    maxQueryExecutionTime: 5000, // Log slow queries
  };

  return optimizedConfig;
};
