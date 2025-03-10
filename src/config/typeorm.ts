import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { DataSource, DataSourceOptions } from 'typeorm';
import 'dotenv/config';
import { User } from '@modules/user/entities/user.entity';
import { DailyMotivation } from '@modules/user/entities/daily-motivation.entity';
import { Comment } from '@modules/forum/entities/comment.entity';
import { Like } from '@modules/forum/entities/like.entity';
import { Post } from '@modules/forum/entities/post.entity';
import { Diary } from '@modules/diary/entities/diary.entity';
import { Entry } from '@modules/diary/entities/entry.entity';
import { Folder } from '@modules/diary/entities/folder.entity';
import { Achievement } from '@modules/planner/entities/achievement.entity';
import { Goal } from '@modules/planner/entities/goal.entity';
import { Medal } from '@modules/planner/entities/medal.entity';
import { Plan } from '@modules/planner/entities/plan.entity';
import { Friendship } from '@modules/user/entities/friendship.entity';

const dataSourceOptions: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    Friendship,
    DailyMotivation,
    Comment,
    Like,
    Post,
    Diary,
    Entry,
    Folder,
    Achievement,
    Goal,
    Medal,
    Plan,
  ],
  synchronize: false,
  migrations: ['dist/*-migrations.js'],
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
