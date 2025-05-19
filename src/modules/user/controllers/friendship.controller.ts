import { AuthGuard } from '@modules/auth/guards/auth.guard';
import {
  Controller,
  Post,
  Param,
  UseGuards,
  Request,
  Query,
  Get,
} from '@nestjs/common';
import { FriendshipService } from '../services/friendship.service';

@Controller('friendships')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Post(':addresseeId')
  @UseGuards(AuthGuard)
  async sendFriendRequest(
    @Param('addresseeId') addresseeId: string,
    @Request() request: any,
  ) {
    const requesterFirebaseUserId = request.user.uid;
    return this.friendshipService.sendFriendRequest(
      requesterFirebaseUserId,
      addresseeId,
    );
  }

  @UseGuards(AuthGuard)
  @Post(':friendshipId/accept')
  async acceptFriendRequest(
    @Param('friendshipId') friendshipId: string,
    @Request() request: any,
  ) {
    const requesterFirebaseUserId = request.user.uid;
    return this.friendshipService.respondToFriendRequest(
      friendshipId,
      requesterFirebaseUserId,
      true,
    );
  }

  @UseGuards(AuthGuard)
  @Post(':friendshipId/reject')
  async rejectFriendRequest(
    @Param('friendshipId') friendshipId: string,
    @Request() request: any,
  ) {
    const requesterFirebaseUserId = request.user.uid;
    return this.friendshipService.respondToFriendRequest(
      friendshipId,
      requesterFirebaseUserId,
      false,
    );
  }

  @Get('friends')
  async getFriends(@Request() request: any, @Query('search') search?: string) {
    const userId = request.user.id;
    return this.friendshipService.getFriends(userId, search);
  }

  @Get('requests/pending')
  async getPendingRequests(
    @Request() request: any,
    @Query('search') search?: string,
  ) {
    const userId = request.user.id;
    return this.friendshipService.getPendingRequests(userId, search);
  }
}
