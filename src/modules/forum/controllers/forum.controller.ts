import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { CommentPostDTO } from '../dtos/create-comment.dto';
import { CreatePostDTO } from '../dtos/create-post.dto';
import { ForumService } from '../services/forum.service';
import { PaginationQueryDto } from 'src/lib/dtos/pagination-query.dto';
import { User } from 'src/lib/decorators/user.decorator';
import { User as UserEntity } from '@modules/user/entities/user.entity';

@Controller('posts')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Post()
  async createPost(
    @Body() createPostDto: CreatePostDTO,
    @User() user: Partial<UserEntity>,
  ) {
    return this.forumService.create(createPostDto, user);
  }

  @Post(':id/like')
  async likePost(
    @Param('id') postId: string,
    @User() user: Partial<UserEntity>,
  ) {
    this.forumService.like(postId, user);
    return true;
  }

  @Post(':id/comment')
  @HttpCode(HttpStatus.CREATED)
  async commentPost(
    @Param('id') postId: string,
    @Body() commentPostDto: CommentPostDTO,
    @Req() request: any,
  ) {
    const user = request.user;
    return this.forumService.comment(postId, commentPostDto, user);
  }

  @Get()
  async getPosts(
    @Query() paginationQuery: PaginationQueryDto,
    @User() user: Partial<UserEntity>,
  ) {
    const userId = user.id;
    console.log(paginationQuery);
    return this.forumService.findAllPosts(paginationQuery, userId);
  }

  @Get(':id/comments')
  async getComments(@Param('id') postId: string) {
    return await this.forumService.getCommentsByPost(postId);
  }

  @Get(':id/likes')
  async getLikes(@Param('id') postId: string) {
    return await this.forumService.getLikesByPost(postId);
  }
}
