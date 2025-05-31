import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  Req,
  UseGuards,
  Delete,
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
import {
  PostResponseDTO,
  CommentResponseDTO,
  LikeResponseDTO,
  LikeActionResponseDTO,
  DeletePostResponseDTO,
} from '../dtos/forum-response.dto';
import { ForumService } from '../services/forum.service';
import { PaginationQueryDto } from 'src/lib/dtos/pagination-query.dto';
import { AuthGuard } from '@modules/auth/guards/auth.guard';

@ApiTags('Forum')
@Controller('posts')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo post' })
  @ApiResponse({
    status: 201,
    description: 'Post criado com sucesso',
    type: PostResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token de autenticação inválido' })
  @UseGuards(AuthGuard)
  @ApiBody({ type: CreatePostDTO })
  async createPost(
    @Body() createPostDto: CreatePostDTO,
    @Request() request: any,
  ) {
    const firebaseUserId = request.user.uid;
    return this.forumService.create(createPostDto, firebaseUserId);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Dá like em um post' })
  @ApiResponse({
    status: 200,
    description: 'Like registrado com sucesso',
    type: LikeActionResponseDTO,
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiResponse({ status: 401, description: 'Token de autenticação inválido' })
  @UseGuards(AuthGuard)
  @ApiParam({ name: 'id', description: 'ID do post', example: '1234' })
  async likePost(@Param('id') postId: string, @Request() request: any) {
    const firebaseUserId = request.user.uid;
    return this.forumService.like(postId, firebaseUserId);
  }

  @Post(':id/comment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Comenta em um post' })
  @ApiResponse({
    status: 201,
    description: 'Comentário adicionado com sucesso',
    type: CommentResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiResponse({ status: 401, description: 'Token de autenticação inválido' })
  @ApiParam({ name: 'id', description: 'ID do post', example: '1234' })
  @ApiBody({ type: CommentPostDTO })
  @UseGuards(AuthGuard)
  async commentPost(
    @Param('id') postId: string,
    @Body() commentPostDto: CommentPostDTO,
    @Req() request: any,
  ) {
    const firebaseUserId = request.user.uid;
    return this.forumService.comment(postId, commentPostDto, firebaseUserId);
  }

  @Get('post-details/:id')
  @ApiOperation({ summary: 'Obtém detalhes completos de um post' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do post retornados com sucesso',
    type: PostResponseDTO,
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiResponse({ status: 401, description: 'Token de autenticação inválido' })
  @ApiParam({ name: 'id', description: 'ID do post', example: '1234' })
  @UseGuards(AuthGuard)
  async getPostDetails(@Param('id') postId: string) {
    return this.forumService.findPostById(postId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtém todos os posts' })
  @ApiResponse({
    status: 200,
    description: 'Lista de posts retornada com sucesso',
    type: [PostResponseDTO],
  })
  @ApiResponse({ status: 401, description: 'Token de autenticação inválido' })
  @ApiQuery({
    name: 'limit',
    description: 'Número máximo de posts por página',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Número de posts para pular',
    required: false,
    example: 0,
  })
  @UseGuards(AuthGuard)
  async getPosts(
    @Query() paginationQuery: PaginationQueryDto,
    @Request() request: any,
  ) {
    const firebaseUserId = request.user.uid;
    return this.forumService.findAllPosts(paginationQuery, firebaseUserId);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Obtém todos os comentários de um post' })
  @ApiResponse({
    status: 200,
    description: 'Comentários retornados com sucesso',
    type: [CommentResponseDTO],
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do post', example: '1234' })
  async getComments(@Param('id') postId: string) {
    return await this.forumService.findCommentsByPost(postId);
  }

  @Get(':id/likes')
  @ApiOperation({ summary: 'Obtém todos os likes de um post' })
  @ApiResponse({
    status: 200,
    description: 'Likes retornados com sucesso',
    type: [LikeResponseDTO],
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do post', example: '1234' })
  async getLikes(@Param('id') postId: string) {
    return await this.forumService.getLikesByPost(postId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deleta um post' })
  @ApiResponse({
    status: 200,
    description: 'Post deletado com sucesso',
    type: DeletePostResponseDTO,
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para deletar este post',
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiResponse({ status: 401, description: 'Token de autenticação inválido' })
  @ApiParam({ name: 'id', description: 'ID do post', example: '1234' })
  @UseGuards(AuthGuard)
  async deletePost(@Param('id') postId: string, @Request() request: any) {
    const firebaseUserId = request.user.uid;
    return await this.forumService.removePost(postId, firebaseUserId);
  }
}
