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
import { Public } from 'src/lib/decorators/public-route.decorators';
import { PaginationQueryDto } from 'src/lib/dtos/pagination-query.dto';

@Controller('posts')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Post()
  @Public()
  async createPost(@Body() createPostDto: CreatePostDTO, @Req() request: any) {
    const user = {
      id: '718202d7-3eb0-4404-9456-65220ee69443',
      email: 'brunonestor2010@gmail.com',
      firstName: 'Bruno',
      lastName: 'Nestor',
    };
    return this.forumService.create(createPostDto, user);
  }

  @Post(':id/like')
  async likePost(@Param('id') postId: string, @Req() request: any) {
    const user = request.user;
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
  async getPosts(@Query() paginationQuery: PaginationQueryDto) {
    const userId = '718202d7-3eb0-4404-9456-65220ee69443';
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
