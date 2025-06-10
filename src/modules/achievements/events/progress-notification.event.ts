export class ProgressNotificationEvent {
  constructor(
    public readonly profileId: string,
    public readonly achievementName: string,
    public readonly progressPercentage: number,
    public readonly currentValue: number,
    public readonly targetValue: number,
  ) {}
}
