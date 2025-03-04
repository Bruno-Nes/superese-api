import { Injectable } from '@nestjs/common';
import { CreatePostDTO } from '../dtos/create-post.dto';
import { DeepPartial, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from 'src/lib/dtos/pagination-query.dto';
import { UserService } from '@modules/user/services/user.service';
import { Like } from '../entities/like.entity';
import { Comment } from '../entities/comment.entity';
import { CommentPostDTO } from '../dtos/create-comment.dto';

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
  ) {}

  async create(post: CreatePostDTO, user: any) {
    const userEntity = await this.userService.findByIdOrThrow(user.id);
    const newPost = this.postRepository.create({
      ...post,
      user: userEntity,
      likesCount: 0,
    });
    await this.postRepository.save(newPost);
    return newPost;
  }

  async findAllPosts(paginationQuery: PaginationQueryDto, userId: string) {
    const { limit, offset } = paginationQuery;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const lastUserPost = await this.postRepository
      .createQueryBuilder('post')
      .where('post.userId = :userId', { userId })
      .andWhere('post.createdAt > :thirtyMinutesAgo', { thirtyMinutesAgo })
      .orderBy('post.createdAt', 'DESC')
      .limit(1)
      .getOne();

    const otherPosts = await this.postRepository
      .createQueryBuilder('post')
      .where('post.userId != :userId', { userId })
      .orderBy('post.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    return lastUserPost ? [lastUserPost, ...otherPosts] : otherPosts;
  }

  async findPostById(id: string) {
    return await this.postRepository.findOne({
      where: { id },
    });
  }

  async comment(postId: string, comment: CommentPostDTO, user: any) {
    const post: DeepPartial<Post> = await this.findPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }
    const newComment = this.commentRepository.create({
      ...comment,
      post,
      user: { id: user.id },
    });
    post.commentsCount++;
    await this.postRepository.save(post);
    await this.commentRepository.save(newComment);
    return newComment;
  }

  async like(postId: string, user: any) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });
    if (!post) {
      throw new Error('Post not found');
    }
    const like = await this.likeRepository.findOne({
      where: { post: { id: postId }, user: { id: user.id } },
    });
    if (like) {
      await this.likeRepository.remove(like);
      post.likesCount--;
      await this.postRepository.save(post);
      return { message: 'Post unliked' };
    }
    const newLike = this.likeRepository.create(post);
    post.likesCount++;
    await this.postRepository.save(post);
    await this.likeRepository.save(newLike);
    return { message: 'Post liked' };
  }

  async getCommentsByPost(postId: string): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: { post: { id: postId } },
      relations: { user: true },
    });
  }

  async getLikesByPost(postId: string) {
    return await this.likeRepository.find({
      where: { post: { id: postId } },
      relations: { user: true },
    });
  }
}
