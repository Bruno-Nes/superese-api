export class AchievementUnlockedEvent {
  constructor(
    public readonly profileId: string,
    public readonly achievementId: string,
    public readonly achievementName: string,
    public readonly achievementCategory: string,
  ) {}
}
