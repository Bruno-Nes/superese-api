import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Comment } from '@modules/forum/entities/comment.entity';
import { Like } from '@modules/forum/entities/like.entity';
import { Post } from '@modules/forum/entities/post.entity';
import { Diary } from '@modules/diary/entities/diary.entity';
import { Folder } from '@modules/diary/entities/folder.entity';
import { Achievement } from '@modules/planner/entities/achievement.entity';
import { Goal } from '@modules/planner/entities/goal.entity';
import { Medal } from '@modules/planner/entities/medal.entity';
import { Plan } from '@modules/planner/entities/plan.entity';
import { Friendship } from '@modules/user/entities/friendship.entity';
import { Profile } from '@modules/user/entities/profile.entity';
import { RecoveryStatus } from '@modules/user/entities/recovery-status.entity';
import { Message } from '@modules/user/entities/message.entity';
import { ConversationHistory } from '@modules/user/entities/conversation-history.entity';

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

  const config: TypeOrmModuleOptions = {
    type: 'postgres',
    url: databaseUrl,
    entities: [
      Profile,
      Friendship,
      Comment,
      Like,
      Post,
      Diary,
      Folder,
      Achievement,
      ConversationHistory,
      Goal,
      Medal,
      Plan,
      RecoveryStatus,
      Message,
    ],
    synchronize: false,
    migrations: ['dist/migrations/*-migrations.js', 'dist/src/migrations/*.js'],
    logging: !isProduction,
    retryAttempts: isProduction ? 10 : 3,
    retryDelay: isProduction ? 3000 : 1000,
    autoLoadEntities: true,
    extra: {
      ssl: isProduction
        ? {
            rejectUnauthorized: false,
          }
        : false,
      connectionTimeoutMillis: 30000,
      max: isProduction ? 10 : 5,
      min: 2,
    },
  };

  return config;
};
