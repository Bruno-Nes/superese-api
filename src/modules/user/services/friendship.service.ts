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
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  FriendRequestSentEvent,
  FriendRequestAcceptedEvent,
} from '@modules/notification/events/notification.events';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
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

    const savedFriendship = await this.friendshipRepository.save(friendship);

    // Emitir evento de solicitação de amizade enviada
    this.eventEmitter.emit(
      'friend.request.sent',
      new FriendRequestSentEvent(
        savedFriendship.id,
        requester.id,
        requester.username,
        addressee.id,
      ),
    );

    return savedFriendship;
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
      relations: ['addressee', 'requester'],
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

    const savedFriendship = await this.friendshipRepository.save(friendship);

    // Emitir evento se a solicitação foi aceita
    if (accept) {
      this.eventEmitter.emit(
        'friend.request.accepted',
        new FriendRequestAcceptedEvent(
          savedFriendship.id,
          reponderProfile.id,
          reponderProfile.username,
          friendship.requester.id,
        ),
      );
    }

    return savedFriendship;
  }

  async getFriends(
    firebaseId: string,
    search?: string,
  ): Promise<{ total: number; results: Profile[] }> {
    const requestedProfile =
      await this.userService.findUserByFirebaseUid(firebaseId);

    if (!requestedProfile) {
      throw new Error('Profile not found!');
    }

    const { id: userId } = requestedProfile;

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

    let filtered = search
      ? friends.filter((f) =>
          `${f.firstName} ${f.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
      : friends;

    filtered = friends.filter((f) => {
      console.log(f);
      return f.id !== userId;
    });

    return {
      total: filtered.length,
      results: filtered,
    };
  }

  async getPendingRequests(
    firebaseUid: string,
    search?: string,
  ): Promise<{ total: number; results: Friendship[] }> {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);
    if (!profile) {
      throw new NotFoundException('Profile not foung!');
    }

    const { id } = profile;
    const requests = await this.friendshipRepository.find({
      where: {
        addressee: { id },
        status: FriendshipStatus.PENDING,
      },
      relations: ['requester'],
    });

    console.log(requests);

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

  async verifyFriendship(userId: string, loggedFirebaseUserId: string) {
    const requestedUser = await this.userService.findByIdOrThrow(userId);
    const currenteUser =
      await this.userService.findUserByFirebaseUid(loggedFirebaseUserId);

    if (!requestedUser || !currenteUser) {
      throw new Error('Users data not found!');
    }
    return await this.isFriend(requestedUser.id, currenteUser.id);
  }

  async isFriend(userIdA: string, userIdB: string): Promise<boolean> {
    const friendship = await this.friendshipRepository
      .createQueryBuilder('friendship')
      .where(
        '(friendship.requester = :userA AND friendship.addressee = :userB) OR (friendship.requester = :userB AND friendship.addressee = :userA)',
        { userA: userIdA, userB: userIdB },
      )
      .andWhere('friendship.status = :status', {
        status: FriendshipStatus.ACCEPTED,
      })
      .getOne();

    return !!friendship;
  }

  async unfriend(
    currentUserFirebaseUid: string,
    friendUserId: string,
  ): Promise<void> {
    // Buscar o perfil do usuário atual
    const currentUser = await this.userService.findUserByFirebaseUid(
      currentUserFirebaseUid,
    );
    if (!currentUser) {
      throw new NotFoundException('Usuário atual não encontrado');
    }

    // Verificar se o usuário a ser removido existe
    const friendUser = await this.profileRepository.findOne({
      where: { id: friendUserId },
    });
    if (!friendUser) {
      throw new NotFoundException('Usuário a ser removido não encontrado');
    }

    // Buscar a amizade existente (independente de quem enviou a solicitação)
    const friendship = await this.friendshipRepository.findOne({
      where: [
        {
          requester: { id: currentUser.id },
          addressee: { id: friendUserId },
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requester: { id: friendUserId },
          addressee: { id: currentUser.id },
          status: FriendshipStatus.ACCEPTED,
        },
      ],
      relations: ['requester', 'addressee'],
    });

    if (!friendship) {
      throw new NotFoundException('Amizade não encontrada ou já foi removida');
    }

    // Remover a amizade do banco de dados
    await this.friendshipRepository.remove(friendship);
  }
}
