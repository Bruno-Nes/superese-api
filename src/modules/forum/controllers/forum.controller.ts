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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CommentPostDTO } from '../dtos/create-comment.dto';
import { CreatePostDTO } from '../dtos/create-post.dto';
import { ForumService } from '../services/forum.service';
import { PaginationQueryDto } from 'src/lib/dtos/pagination-query.dto';
import { User } from 'src/lib/decorators/user.decorator';
import { Profile } from '@modules/user/entities/profile.entity';

@ApiTags('Forum')
@Controller('posts')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo post' })
  @ApiResponse({ status: 201, description: 'Post criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiBody({ type: CreatePostDTO })
  async createPost(
    @Body() createPostDto: CreatePostDTO,
    @User() user: Partial<Profile>,
  ) {
    return this.forumService.create(createPostDto, user);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Dá like em um post' })
  @ApiResponse({ status: 200, description: 'Like registrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do post', example: '1234' })
  async likePost(
    @Param('id') postId: string,
    @User() profile: Partial<Profile>,
  ) {
    this.forumService.like(postId, profile);
    return true;
  }

  @Post(':id/comment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Comenta em um post' })
  @ApiResponse({
    status: 201,
    description: 'Comentário adicionado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do post', example: '1234' })
  @ApiBody({ type: CommentPostDTO })
  async commentPost(
    @Param('id') postId: string,
    @Body() commentPostDto: CommentPostDTO,
    @Req() request: any,
  ) {
    const user = request.user;
    return this.forumService.comment(postId, commentPostDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Obtém todos os posts' })
  @ApiResponse({
    status: 200,
    description: 'Lista de posts retornada com sucesso',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Número máximo de posts por página',
    required: false,
  })
  @ApiQuery({ name: 'page', description: 'Número da página', required: false })
  async getPosts(
    @Query() paginationQuery: PaginationQueryDto,
    @User() profile: Partial<Profile>,
  ) {
    const profileId = profile.id;
    console.log(paginationQuery);
    return this.forumService.findAllPosts(paginationQuery, profileId);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Obtém todos os comentários de um post' })
  @ApiResponse({
    status: 200,
    description: 'Comentários retornados com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do post', example: '1234' })
  async getComments(@Param('id') postId: string) {
    return await this.forumService.getCommentsByPost(postId);
  }

  @Get(':id/likes')
  @ApiOperation({ summary: 'Obtém todos os likes de um post' })
  @ApiResponse({ status: 200, description: 'Likes retornados com sucesso' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do post', example: '1234' })
  async getLikes(@Param('id') postId: string) {
    return await this.forumService.getLikesByPost(postId);
  }
}
