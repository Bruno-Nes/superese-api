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
        model: 'gpt-4.1',
        store: true,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      });
      this.logger.debug(completion);
      const response = completion.choices[0].message.content?.trim() || '';
      return response;
    } catch (error) {
      this.logger.error('OpenAI API Error:', error);
      throw new Error(`Erro na consulta ao OpenAI: ${error.message}`);
    }
  }
}
