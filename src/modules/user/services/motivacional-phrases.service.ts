import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MotivacionalPhrases } from '../entities/motivacional-phrases.entity';
import { Repository } from 'typeorm';
import { OpenAIService } from '@modules/openai/openai.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class MotivacionalPhrasesService {
  private readonly logger = new Logger(MotivacionalPhrasesService.name);
  constructor(
    @InjectRepository(MotivacionalPhrases)
    private readonly repo: Repository<MotivacionalPhrases>,
    private readonly openAi: OpenAIService,
  ) {}

  @Cron('0 2 */5 * *') // minuto hora dia-múltiplo mês dia-da-semana
  async generateMotivationalPhrases() {
    this.logger.log('🔁 Rodando geração de frases motivacionais...');

    // Exemplo fictício da chamada à IA ou geração:
    const humores = ['triste', 'ansioso', 'esperançoso', 'feliz', 'desanimado'];

    for (const humor of humores) {
      // Aqui você chamaria a OpenAI ou seu gerador local
      await this.createPhrases(humor);
    }

    this.logger.log('✅ Geração finalizada!');
  }

  private async createPhrases(humor: string) {
    const prompt = `
        Você é uma inteligência artificial que ajuda pessoas a superarem o vício em apostas. 
Com base no humor atual da pessoa ("${humor}"), escreva 10 frases motivacionais que:
- Seja neutra e acolhedora
- Reforce que ela está no caminho certo
- Encoraje a continuar longe das apostas

Frase:
    `;
    const phrases = await this.openAi.create(prompt);
    const data = this.repo.create({
      humor,
      text: phrases,
    });

    await this.repo.save(data);
  }
}
