import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import { ConversationService } from './conversation-history.service';
import { PlannerService } from '../../planner/services/planner.service';
import { GPTConsultationRequestDto } from '../dtos/gpt-consultation-request.dto';
import { GPTConsultationResponseDto } from '../dtos/gpt-consultation-response.dto';
import { MoodType } from '../entities/conversation-history.entity';
import { Plan } from '../../planner/entities/plan.entity';
import { CreatePlanDTO } from '../../planner/dtos/create-plan.dto';
import { CreateGoalDTO } from '../../planner/dtos/create-goal.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Profile } from '../entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

interface ExtractedPlanData {
  title: string;
  description: string;
  steps: string[];
}

@Injectable()
export class GPTConsultationService {
  private log: Logger = new Logger(GPTConsultationService.name);

  constructor(
    private openAIService: OpenAIService,
    private conversationService: ConversationService,
    private plannerService: PlannerService,
    private eventEmitter: EventEmitter2,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async consultGPT(
    requestDto: GPTConsultationRequestDto,
    firebaseUid: string,
  ): Promise<GPTConsultationResponseDto> {
    const { mood, userMessage } = requestDto;
    
    this.log.log('=== Starting GPT Consultation Service ===');
    this.log.log(`Firebase UID: ${firebaseUid}`);
    this.log.log(`Mood: ${mood}`);
    this.log.log(`User message: ${userMessage}`);

    // Construir prompt baseado no mood
    this.log.debug('Building prompt based on mood...');
    const prompt = this.buildPromptByMood(mood, userMessage);
    this.log.debug(`Prompt length: ${prompt.length} characters`);

    try {
      // Consultar OpenAI
      this.log.log('Calling OpenAI service...');
      const gptResponse = await this.openAIService.create(prompt);
      this.log.log(
        `GPT response received. Length: ${gptResponse.length} characters`,
      );
      this.log.debug('GPT Response:', gptResponse);

      // Salvar no histórico de conversas
      this.log.log('Saving conversation to history...');
      const conversation = await this.conversationService.create(
        {
          mood,
          userInput: userMessage,
          gptResponse,
        },
        firebaseUid,
      );
      this.log.log(`Conversation saved with ID: ${conversation.id}`);

      // Verificar se existe plano na resposta
      this.log.log('Extracting plan data from GPT response...');
      const planData = this.extractPlanFromResponse(gptResponse);
      this.log.debug('Extracted Plan Data:', planData);
      let createdPlan: Plan | null = null;

      if (planData) {
        this.log.log('Plan data found. Creating plan...');
        const createPlanDto: CreatePlanDTO = {
          description: planData.description,
          duration: 7, // Duração padrão de 7 dias
          goals: planData.steps.map(
            (step): CreateGoalDTO => ({
              description: step,
            }),
          ),
        };

        this.log.debug('Plan DTO:', createPlanDto);
        createdPlan = await this.plannerService.createPlan(
          createPlanDto,
          firebaseUid,
        );
        this.log.log(`Plan created successfully with ID: ${createdPlan.id}`);
      } else {
        this.log.log('No plan data detected in GPT response');
      }

      // Buscar profile do usuário
      this.log.log('Fetching user profile...');
      const profile: Profile = await this.profileRepository.findOneBy({
        firebaseUid,
      });
      if (!profile) {
        this.log.error(`Profile not found for Firebase UID: ${firebaseUid}`);
        throw new NotFoundException('Profile not found!');
      }
      this.log.log(`Profile found with ID: ${profile.id}`);

      // Emitir evento para conquista de busca por ajuda da IA
      this.log.log('Emitting achievement event...');
      this.eventEmitter.emit('gpt.consultation.help', {
        profileId: profile.id,
        actionType: 'ai_help_seeking',
        data: {
          conversationType: 'ai_help',
          mood,
          planCreated: !!createdPlan,
        },
      });
      this.log.log('Achievement event emitted successfully');

      // Limpar tags internas da resposta antes de retornar ao frontend
      this.log.log('Cleaning internal tags from response...');
      const cleanedGptResponse = this.removeInternalTags(gptResponse);
      this.log.log(
        `Response cleaned. Final length: ${cleanedGptResponse.length} characters`,
      );

      // Retornar resposta
      const response: GPTConsultationResponseDto = {
        message: 'Consulta realizada com sucesso',
        gptResponse: cleanedGptResponse,
        conversationId: conversation.id,
      };

      if (createdPlan) {
        response.planCreated = {
          id: createdPlan.id,
          title: createdPlan.description, // Usando description como title
          description: createdPlan.description,
          steps: createdPlan.goals?.map((goal) => goal.description) || [],
        };
      }

      this.log.log('GPT consultation completed successfully');
      return response;
    } catch (error) {
      this.log.error('Error in GPT consultation service:', error);
      this.log.error(`Firebase UID: ${firebaseUid}`);
      this.log.error(`Mood: ${mood}`);
      this.log.error(`User message: ${userMessage}`);
      this.log.error(`Error message: ${error.message}`);
      this.log.error(`Error stack: ${error.stack}`);
      throw new Error('Erro ao consultar o GPT: ' + error.message);
    }
  }

  private buildPromptByMood(mood: MoodType, userMessage: string): string {
    const baseInstruction = `IMPORTANTE: Se o usuário solicitar explicitamente um plano (usando palavras como "crie um plano", "quero um plano", "preciso de um plano"), você DEVE criar um plano de ação específico entre as tags <criarPlano> e </criarPlano> no formato JSON com as propriedades: title, description, steps (array de strings).`;

    const moodPrompts = {
      ansiedade: `Você é um assistente terapêutico especializado em ansiedade. O usuário está lidando com ansiedade e precisa de apoio e orientação. 

${baseInstruction}

Responda de forma empática, compreensiva e ofereça estratégias práticas para lidar com a ansiedade.

Mensagem do usuário: ${userMessage}`,

      impulsividade: `Você é um assistente terapêutico especializado em impulsividade. O usuário está lidando com comportamentos impulsivos e precisa de estratégias de autocontrole.

${baseInstruction}

Responda de forma empática e ofereça técnicas práticas para gerenciar a impulsividade.

Mensagem do usuário: ${userMessage}`,

      culpa: `Você é um assistente terapêutico especializado em sentimentos de culpa. O usuário está lidando com culpa e precisa de apoio para processar esses sentimentos.

${baseInstruction}

Responda de forma empática, validando os sentimentos e oferecendo perspectivas saudáveis sobre a culpa.

Mensagem do usuário: ${userMessage}`,

      vergonha: `Você é um assistente terapêutico especializado em sentimentos de vergonha. O usuário está lidando com vergonha e precisa de apoio para superar esses sentimentos.

${baseInstruction}

Responda de forma empática, oferecendo validação e estratégias para lidar com a vergonha de forma saudável.

Mensagem do usuário: ${userMessage}`,

      desesperança: `Você é um assistente terapêutico especializado em sentimentos de desesperança. O usuário está passando por um momento difícil e precisa de apoio e esperança.

${baseInstruction}

Responda de forma empática, oferecendo perspectivas de esperança e estratégias para lidar com a desesperança.

Mensagem do usuário: ${userMessage}`,
    };

    return moodPrompts[mood] || moodPrompts.ansiedade;
  }

  private extractPlanFromResponse(
    gptResponse: string,
  ): ExtractedPlanData | null {
    this.log.debug('Starting plan extraction from GPT response...');
    this.log.debug(`Response length: ${gptResponse.length} characters`);

    try {
      const planMatch = gptResponse.match(
        /<criarPlano>([\s\S]*?)<\/criarPlano>/,
      );
      this.log.debug(
        'Plan regex match result:',
        planMatch ? 'Found' : 'Not found',
      );

      if (!planMatch) {
        this.log.debug('No plan found in <criarPlano> tags');
        return null;
      }

      const planJson = planMatch[1].trim();
      this.log.debug(`Extracted JSON: ${planJson}`);

      const planData = JSON.parse(planJson);
      this.log.debug('Parsed plan data:', planData);

      // Validar estrutura do plano
      if (
        !planData.title ||
        !planData.description ||
        !Array.isArray(planData.steps)
      ) {
        this.log.warn('Invalid plan structure detected:', planData);
        return null;
      }

      this.log.log('Plan extracted successfully');
      this.log.debug('Plan details:', {
        title: planData.title,
        description: planData.description,
        stepsCount: planData.steps.length,
      });

      return {
        title: planData.title,
        description: planData.description,
        steps: planData.steps,
      };
    } catch (error) {
      this.log.error('Error extracting plan from response:', error);
      this.log.error(`Error message: ${error.message}`);
      return null;
    }
  }

  /**
   * Remove tags internas utilizadas para comunicação com o GPT
   * que não devem ser exibidas ao usuário final
   */
  private removeInternalTags(gptResponse: string): string {
    this.log.debug('Removing internal tags from GPT response...');
    this.log.debug(
      `Original response length: ${gptResponse.length} characters`,
    );

    // Remove tags <criarPlano> e seu conteúdo
    let cleanedResponse = gptResponse.replace(
      /<criarPlano>[\s\S]*?<\/criarPlano>/g,
      '',
    );

    // Remove quebras de linha extras que podem ter sobrado
    cleanedResponse = cleanedResponse.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

    this.log.debug(
      `Cleaned response length: ${cleanedResponse.length} characters`,
    );
    this.log.debug('Internal tags removed successfully');

    return cleanedResponse;
  }

  async gerarRelatorioMotivacional(
    planId: string,
    firebaseUid: string,
  ): Promise<{ relatorio: string; reportId: string }> {
    this.log.log('=== Starting Motivational Report Generation ===');
    this.log.log(`Plan ID: ${planId}`);
    this.log.log(`Firebase UID: ${firebaseUid}`);

    try {
      // Buscar o plano com todas as informações necessárias
      this.log.log('Fetching user plans...');
      const plano = await this.plannerService.findAllByProfile(firebaseUid);
      const planoEspecifico = plano.find((p) => p.id === planId);

      if (!planoEspecifico) {
        this.log.error(`Plan not found or doesn't belong to user: ${planId}`);
        throw new Error('Plano não encontrado ou não pertence ao usuário');
      }

      this.log.log(`Plan found: ${planoEspecifico.description}`);
      this.log.log(
        `Plan progress: ${planoEspecifico.progress}/${planoEspecifico.duration} days`,
      );
      this.log.log(`Plan completed: ${planoEspecifico.completed}`);
      this.log.log(`Goals count: ${planoEspecifico.goals?.length || 0}`);
      this.log.log(
        `Observations count: ${planoEspecifico.observations?.length || 0}`,
      );

      // Preparar dados para o prompt
      const metasTexto = planoEspecifico.goals?.length
        ? planoEspecifico.goals
            .map((meta, i) => `Meta ${i + 1}: ${meta.description}`)
            .join('\n')
        : 'Nenhuma meta definida.';

      const observacoesTexto = planoEspecifico.observations?.length
        ? planoEspecifico.observations
            .map((obs, i) => `Dia ${i + 1} - ${obs.text}`)
            .join('\n')
        : 'Nenhuma observação registrada.';

      const progressoPercentual = Math.round(
        (planoEspecifico.progress / planoEspecifico.duration) * 100,
      );

      this.log.log(`Progress percentage: ${progressoPercentual}%`);

      // Construir prompt motivacional
      this.log.log('Building motivational prompt...');
      const prompt = `
Você é um coach motivacional especializado em recuperação e desenvolvimento pessoal. Com base no plano de recuperação do usuário e suas observações ao longo da jornada, escreva uma mensagem motivacional personalizada de aproximadamente 300-400 palavras.

IMPORTANTE: Sua resposta deve ser uma mensagem motivacional fluida e inspiradora, não uma lista ou estrutura formal. Foque em:

- Reconhecer o esforço e dedicação demonstrados
- Destacar o que o usuário pode aprender com essa experiência
- Mostrar como ele pode usar esses aprendizados para evoluir daqui pra frente
- Dar uma mensagem de incentivo final poderosa

DADOS DO PLANO:
Título: ${planoEspecifico.description}
Duração: ${planoEspecifico.duration} dias
Progresso atual: ${planoEspecifico.progress}/${planoEspecifico.duration} dias (${progressoPercentual}%)
Status: ${planoEspecifico.completed ? 'Concluído' : 'Em andamento'}

METAS ESTABELECIDAS:
${metasTexto}

OBSERVAÇÕES DO USUÁRIO DURANTE A JORNADA:
${observacoesTexto}

Escreva uma mensagem motivacional que reflita especificamente sobre essa jornada e inspire o usuário a continuar crescendo.
`.trim();

      this.log.debug(`Prompt length: ${prompt.length} characters`);

      // Consultar OpenAI para gerar o relatório
      this.log.log('Calling OpenAI for motivational report generation...');
      const relatorioMotivacional = await this.openAIService.create(prompt);
      this.log.log(
        `Motivational report generated. Length: ${relatorioMotivacional.length} characters`,
      );

      // Salvar o relatório no banco de dados
      this.log.log('Saving motivational report to database...');
      const savedReport = await this.plannerService.saveMotivationalReport(
        planId,
        relatorioMotivacional,
        firebaseUid,
      );

      this.log.log(`Motivational report saved with ID: ${savedReport.id}`);
      this.log.log('Motivational report generation completed successfully');

      return {
        relatorio: relatorioMotivacional,
        reportId: savedReport.id,
      };
    } catch (error) {
      this.log.error('Error generating motivational report:', error);
      this.log.error(`Plan ID: ${planId}`);
      this.log.error(`Firebase UID: ${firebaseUid}`);
      this.log.error(`Error message: ${error.message}`);
      this.log.error(`Error stack: ${error.stack}`);
      throw new Error('Erro ao gerar relatório motivacional: ' + error.message);
    }
  }
}
