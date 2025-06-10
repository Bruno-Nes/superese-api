export class UserActionEvent {
  constructor(
    public readonly profileId: string,
    public readonly actionType: string,
    public readonly data?: any,
  ) {}
}

// Eventos específicos para facilitar o uso
export class ForumPostCreatedEvent extends UserActionEvent {
  constructor(profileId: string, postId: string) {
    super(profileId, 'forum_post_created', { postId });
  }
}

export class ForumInteractionEvent extends UserActionEvent {
  constructor(
    profileId: string,
    interactionType: 'comment' | 'like',
    targetId: string,
  ) {
    super(profileId, 'forum_interaction', { interactionType, targetId });
  }
}

export class FriendConnectionEvent extends UserActionEvent {
  constructor(profileId: string, friendId: string) {
    super(profileId, 'friend_connection', { friendId });
  }
}

export class DiaryEntryCreatedEvent extends UserActionEvent {
  constructor(
    profileId: string,
    entryId: string,
    hasReflection: boolean = false,
  ) {
    super(profileId, 'diary_entry_created', { entryId, hasReflection });
  }
}

export class PlanProgressEvent extends UserActionEvent {
  constructor(
    profileId: string,
    planId: string,
    progressType: 'increase' | 'completion',
  ) {
    super(profileId, 'plan_progress', { planId, progressType });
  }
}

export class ChatConversationEvent extends UserActionEvent {
  constructor(profileId: string, conversationType: 'ai_help' | 'new_friend') {
    super(profileId, 'chat_conversation', { conversationType });
  }
}
