import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { DataSource, DataSourceOptions } from 'typeorm';
import 'dotenv/config';
import { User } from '@modules/user/entities/user.entity';
import { Addiction } from '@modules/user/entities/addiction.entity';
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
  type: process.env.DATABASE_TYPE as any,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [
    User,
    Friendship,
    Addiction,
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
  debug: false,
};

export const AppDataSource = new DataSource(
  dataSourceOptions as DataSourceOptions,
);

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions)],
})
export class DatabaseModule {}
