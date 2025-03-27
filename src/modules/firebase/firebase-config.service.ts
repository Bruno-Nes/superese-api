export class FirebaseConfigService {
  constructor(public readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('Missing Api Key');
    }
  }
}
