export class PostLikedEvent {
  constructor(
    public readonly postId: string,
    public readonly postAuthorId: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class CommentCreatedEvent {
  constructor(
    public readonly postId: string,
    public readonly commentId: string,
    public readonly postAuthorId: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class ReplyCreatedEvent {
  constructor(
    public readonly postId: string,
    public readonly commentId: string,
    public readonly parentCommentAuthorId: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class FriendRequestSentEvent {
  constructor(
    public readonly friendshipId: string,
    public readonly requesterId: string,
    public readonly requesterName: string,
    public readonly recipientId: string,
  ) {}
}

export class FriendRequestAcceptedEvent {
  constructor(
    public readonly friendshipId: string,
    public readonly accepterId: string,
    public readonly accepterName: string,
    public readonly requesterId: string,
  ) {}
}
