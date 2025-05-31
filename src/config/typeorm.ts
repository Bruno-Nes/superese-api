import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { DataSource, DataSourceOptions } from 'typeorm';
import 'dotenv/config';
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

const dataSourceOptions: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
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
  logging: false,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
};

export const AppDataSource = new DataSource(
  dataSourceOptions as DataSourceOptions,
);

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions)],
})
export class DatabaseModule {}
