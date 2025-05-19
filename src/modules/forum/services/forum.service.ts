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
      throw new Error('Profile not foung!');
    }
    const id = profile.id;

    const { limit, offset } = paginationQuery;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const lastUserPost = await this.postRepository
      .createQueryBuilder('post')
      .where('post.profileId = :profileId', { profileId: id })
      .andWhere('post.createdAt > :thirtyMinutesAgo', { thirtyMinutesAgo })
      .leftJoinAndSelect('post.profile', 'profile')
      .orderBy('post.createdAt', 'DESC')
      .limit(1)
      .getOne();

    const lastPostId = lastUserPost ? lastUserPost.id : '';

    const otherPosts = await this.postRepository
      .createQueryBuilder('post')
      .where('post.id != :postId', { postId: lastPostId })
      .leftJoinAndSelect('post.profile', 'profile')
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
    await this.commentRepository.save(newComment);
    return newComment;
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
    return { value: true, message: 'Post liked' };
  }

  async findCommentsByPost(postId: string) {
    const comments = await this.commentRepository.find({
      where: { post: { id: postId }, parentComment: null },
      relations: ['user', 'replies', 'replies.user', 'replies.replies'],
      order: { createdAt: 'ASC' },
    });

    const buildTree = (comment: Comment): any => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      profile: {
        id: comment.profile.id,
        username: comment.profile.username,
      },
      replies: (comment.replies || []).map(buildTree),
    });

    return comments.map(buildTree);
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

    await this.postRepository.delete(postId);
  }
}
