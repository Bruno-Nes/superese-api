import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDTO {
  @ApiProperty({
    description: 'ID do perfil',
    example: 'uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Nome de usuário',
    example: 'joao123',
  })
  username: string;
}

export class CommentResponseDTO {
  @ApiProperty({
    description: 'ID do comentário',
    example: 'uuid-456',
  })
  id: string;

  @ApiProperty({
    description: 'Conteúdo do comentário',
    example: 'Excelente post!',
  })
  content: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T11:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Dados do perfil que criou o comentário',
  })
  profile: ProfileResponseDTO;

  @ApiProperty({
    description: 'Respostas ao comentário',
    type: [CommentResponseDTO],
    required: false,
  })
  replies?: CommentResponseDTO[];
}

export class PostResponseDTO {
  @ApiProperty({
    description: 'ID do post',
    example: 'uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Título do post',
    example: 'Meu primeiro post',
  })
  title: string;

  @ApiProperty({
    description: 'Conteúdo do post',
    example: 'Este é o conteúdo do meu primeiro post no fórum.',
  })
  content: string;

  @ApiProperty({
    description: 'Número de likes',
    example: 15,
  })
  likesCount: number;

  @ApiProperty({
    description: 'Número de comentários',
    example: 5,
  })
  commentsCount: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Dados do perfil que criou o post',
  })
  profile: ProfileResponseDTO;

  @ApiProperty({
    description: 'Comentários do post',
    type: [CommentResponseDTO],
    required: false,
  })
  comments?: CommentResponseDTO[];
}

export class LikeResponseDTO {
  @ApiProperty({
    description: 'ID do like',
    example: 'uuid-789',
  })
  id: string;

  @ApiProperty({
    description: 'ID do post',
    example: 'uuid-123',
  })
  postId: string;

  @ApiProperty({
    description: 'ID do perfil',
    example: 'uuid-456',
  })
  profileId: string;

  @ApiProperty({
    description: 'Dados do perfil que deu o like',
  })
  profile: ProfileResponseDTO;
}

export class LikeActionResponseDTO {
  @ApiProperty({
    description: 'Se o post foi curtido (true) ou descurtido (false)',
    example: true,
  })
  value: boolean;

  @ApiProperty({
    description: 'Mensagem de status',
    example: 'Post liked',
  })
  message: string;
}

export class DeletePostResponseDTO {
  @ApiProperty({
    description: 'Resultado da operação',
    example: { affected: 1 },
  })
  affected: number;
}

export class PaginatedPostsResponseDTO {
  @ApiProperty({
    description: 'Lista de posts',
    type: [PostResponseDTO],
  })
  data: PostResponseDTO[];

  @ApiProperty({
    description: 'Total de posts',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: 'Página atual',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Limite por página',
    example: 10,
  })
  limit: number;
}
