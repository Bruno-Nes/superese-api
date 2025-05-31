import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private logger: Logger;
  constructor(@Inject('OPENAI_API') private api: OpenAI) {
    this.logger = new Logger(OpenAIService.name);
  }

  async create(prompt: string): Promise<string> {
    try {
      const completion = await this.api.chat.completions.create({
        model: 'gpt-3.5-turbo',
        store: true,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 100,
      });
      this.logger.debug(completion);
      const frase = completion.choices[0].message.content.trim();
      return frase;
    } catch (error) {
      throw new Error(error);
    }
  }
}
