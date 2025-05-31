import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { UserModule } from '../user/user.module';
import { ForumController } from './controllers/forum.controller';
import { ForumService } from './services/forum.service';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Comment, Post, Like])],
  controllers: [ForumController],
  providers: [ForumService],
})
export class ForumModule {}
