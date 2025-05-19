import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship, FriendshipStatus } from '../entities/friendship.entity';
import { Profile } from '../entities/profile.entity';
import { UserService } from './user.service';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly userService: UserService,
  ) {}

  async sendFriendRequest(
    requesterId: string,
    addresseeId: string,
  ): Promise<Friendship> {
    if (requesterId === addresseeId) {
      throw new BadRequestException(
        'Você não pode adicionar a si mesmo como amigo.',
      );
    }

    const requester: Profile =
      await this.userService.findUserByFirebaseUid(requesterId);
    if (!requester) {
      throw new NotFoundException('Profile not foung!');
    }

    const addressee = await this.profileRepository.findOne({
      where: { id: addresseeId },
    });

    if (!requester || !addressee) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const existingFriendship = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: requesterId }, addressee: { id: addresseeId } },
        { requester: { id: addresseeId }, addressee: { id: requesterId } },
      ],
    });

    if (existingFriendship) {
      throw new BadRequestException('Solicitação de amizade já existente.');
    }

    const friendship = this.friendshipRepository.create({
      requester,
      addressee,
      status: FriendshipStatus.PENDING,
    });

    return this.friendshipRepository.save(friendship);
  }

  async respondToFriendRequest(
    friendshipId: string,
    responderId: string,
    accept: boolean,
  ): Promise<Friendship> {
    const reponderProfile =
      await this.userService.findUserByFirebaseUid(responderId);

    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
      relations: ['addressee'],
    });

    if (!friendship) {
      throw new NotFoundException('Friendship request not found!');
    }

    if (friendship.addressee.id !== reponderProfile.id) {
      throw new BadRequestException(
        'Permission to respond to this request denied',
      );
    }

    friendship.status = accept
      ? FriendshipStatus.ACCEPTED
      : FriendshipStatus.REJECTED;

    return this.friendshipRepository.save(friendship);
  }

  async getFriends(
    userId: string,
    search?: string,
  ): Promise<{ total: number; results: Profile[] }> {
    console.log('usuario', userId);
    const friendships = await this.friendshipRepository.find({
      where: [
        { requester: { id: userId }, status: FriendshipStatus.ACCEPTED },
        { addressee: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
    });

    const friends = friendships.map((f) =>
      f.requester.id === userId ? f.addressee : f.requester,
    );

    const filtered = search
      ? friends.filter((f) =>
          `${f.firstName} ${f.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
      : friends;

    return {
      total: filtered.length,
      results: filtered,
    };
  }

  async getPendingRequests(
    userId: string,
    search?: string,
  ): Promise<{ total: number; results: Friendship[] }> {
    const requests = await this.friendshipRepository.find({
      where: {
        addressee: { id: userId },
        status: FriendshipStatus.PENDING,
      },
      relations: ['requester'],
    });

    const filtered = search
      ? requests.filter((r) =>
          `${r.requester.firstName} ${r.requester.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
      : requests;

    return {
      total: filtered.length,
      results: filtered,
    };
  }
}
