import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDTO } from '../dtos/create-post.dto';
import { DeepPartial, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from 'src/lib/dtos/pagination-query.dto';
import { UserService } from '@modules/user/services/user.service';
import { Like } from '../entities/like.entity';
import { Comment } from '../entities/comment.entity';
import { CommentPostDTO } from '../dtos/create-comment.dto';
import { Profile } from '@modules/user/entities/profile.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PostLikedEvent,
  CommentCreatedEvent,
  ReplyCreatedEvent,
} from '@modules/notification/events/notification.events';

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(post: CreatePostDTO, firebaseUid: string) {
    const profile = await this.userService.findUserByFirebaseUid(firebaseUid);
    const newPost = this.postRepository.create({
      ...post,
      profile,
      likesCount: 0,
    });
    await this.postRepository.save(newPost);
    return newPost;
  }

  async findAllPosts(paginationQuery: PaginationQueryDto, firebaseUid: string) {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);
    if (!profile) {
      throw new Error('Profile not found!');
    }

    const { limit, offset } = paginationQuery;
    console.log('Finding posts with limit:', limit, 'and offset:', offset);

    const posts = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.profile', 'profile')
      .orderBy('post.createdAt', 'DESC')
      .getMany();

    return posts;
  }

  async findPostById(id: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: {
        profile: true,
      },
    });

    if (post) {
      const comments = await this.findCommentsByPost(post.id);
      // Usar qualquer tipo para os comentários para evitar problemas de tipagem
      (post as any).comments = comments;
    }

    return post;
  }

  async comment(postId: string, comment: CommentPostDTO, firebaseUid: string) {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);
    const { id } = profile;
    const post: DeepPartial<Post> = await this.findPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    let parentComment = null;
    if (comment.parentCommentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: comment.parentCommentId },
        relations: ['profile'],
      });
      if (!parentComment)
        throw new NotFoundException('Parent comment not found');
    }

    const newComment = this.commentRepository.create({
      ...comment,
      post,
      profile: { id },
      parentComment,
    });
    post.commentsCount++;
    await this.postRepository.save(post);
    const savedComment = await this.commentRepository.save(newComment);

    // Emitir eventos de notificação
    if (parentComment) {
      // É uma resposta a um comentário
      this.eventEmitter.emit(
        'reply.created',
        new ReplyCreatedEvent(
          postId,
          savedComment.id,
          parentComment.profile.id,
          profile.id,
          profile.username,
        ),
      );
    } else {
      // É um comentário direto no post
      this.eventEmitter.emit(
        'comment.created',
        new CommentCreatedEvent(
          postId,
          savedComment.id,
          post.profile.id,
          profile.id,
          profile.username,
        ),
      );
    }

    return savedComment;
  }

  async like(postId: string, firebaseUid: string) {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);
    const { id } = profile;
    const post: DeepPartial<Post> = await this.findPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }
    const like = await this.likeRepository.findOne({
      where: { post: { id: postId }, profile: { id } },
    });
    if (like) {
      await this.likeRepository.remove(like);
      post.likesCount--;
      await this.postRepository.save(post);
      return { value: false, message: 'Post unliked' };
    }
    const newLike = this.likeRepository.create({
      postId: postId,
      profileId: id,
    });
    post.likesCount++;
    await this.postRepository.save(post);
    await this.likeRepository.save(newLike);

    // Emitir evento de like
    this.eventEmitter.emit(
      'post.liked',
      new PostLikedEvent(postId, post.profile.id, profile.id, profile.username),
    );

    // Verificar milestones de popularidade
    this.checkPostPopularityMilestones(
      postId,
      post.likesCount,
      post.profile.id,
    );

    return { value: true, message: 'Post liked' };
  }

  async findCommentsByPost(postId: string) {
    // Buscar apenas comentários principais (sem pai) usando IS NULL
    const comments = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.profile', 'profile')
      .where('comment.post_id = :postId', { postId })
      .andWhere('comment.parent_comment_id IS NULL')
      .orderBy('comment.createdAt', 'ASC')
      .getMany();

    // Para cada comentário principal, buscar suas replies recursivamente
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await this.findRepliesByComment(comment.id);
        return {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          profile: {
            id: comment.profile.id,
            username: comment.profile.username,
          },
          replies: replies,
        };
      }),
    );

    return commentsWithReplies;
  }

  // Método auxiliar para buscar replies recursivamente
  private async findRepliesByComment(commentId: string): Promise<any[]> {
    const replies = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.profile', 'profile')
      .where('comment.parent_comment_id = :commentId', { commentId })
      .orderBy('comment.createdAt', 'ASC')
      .getMany();

    // Buscar replies das replies (recursivo)
    const repliesWithSubReplies = await Promise.all(
      replies.map(async (reply) => {
        const subReplies = await this.findRepliesByComment(reply.id);
        return {
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          profile: {
            id: reply.profile.id,
            username: reply.profile.username,
          },
          replies: subReplies,
        };
      }),
    );

    return repliesWithSubReplies;
  }

  async getLikesByPost(postId: string) {
    return await this.likeRepository.find({
      where: { post: { id: postId } },
      relations: { profile: true },
    });
  }

  async removePost(postId: string, firebaseUid: string) {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);
    if (!profile) {
      throw new NotFoundException('Profile not foung!');
    }

    const profileId = profile.id;

    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['profile', 'likes', 'comments'],
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    if (post.profile.id !== profileId) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar este post',
      );
    }
    await this.commentRepository.delete({ post: { id: postId } });
    await this.likeRepository.delete({ post: { id: postId } });

    return await this.postRepository.delete(postId);
  }

  private checkPostPopularityMilestones(
    postId: string,
    likesCount: number,
    authorId: string,
  ): void {
    const milestones = [10, 50, 100];

    // Verificar se atingiu algum milestone
    if (milestones.includes(likesCount)) {
      this.eventEmitter.emit('post.likes.milestone', {
        postId,
        authorId,
        likesCount,
        milestone: likesCount,
      });
    }
  }
}
