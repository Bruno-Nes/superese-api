import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import { ConversationService } from './conversation-history.service';
import { PlannerService } from '../../planner/services/planner.service';
import { GPTConsultationRequestDto } from '../dtos/gpt-consultation-request.dto';
import { GPTConsultationResponseDto } from '../dtos/gpt-consultation-response.dto';
import { MoodType } from '../entities/conversation-history.entity';
import { Plan } from '../../planner/entities/plan.entity';
import { CreatePlanDTO } from '../../planner/dtos/create-plan.dto';
import { CreateGoalDTO } from '../../planner/dtos/create-goal.dto';

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
  ) {}

  async consultGPT(
    requestDto: GPTConsultationRequestDto,
    firebaseUid: string,
  ): Promise<GPTConsultationResponseDto> {
    const { mood, userMessage } = requestDto;

    // Construir prompt baseado no mood
    const prompt = this.buildPromptByMood(mood, userMessage);

    try {
      // Consultar OpenAI
      const gptResponse = await this.openAIService.create(prompt);

      this.log.debug('GPT Response:', gptResponse);

      // Salvar no histórico de conversas
      const conversation = await this.conversationService.create(
        {
          mood,
          userInput: userMessage,
          gptResponse,
        },
        firebaseUid,
      );

      // Verificar se existe plano na resposta
      const planData = this.extractPlanFromResponse(gptResponse);
      this.log.debug('Extracted Plan Data:', planData);
      let createdPlan: Plan | null = null;

      if (planData) {
        // Converter para o formato esperado pelo PlannerService
        const createPlanDto: CreatePlanDTO = {
          description: planData.description,
          duration: 7, // Duração padrão de 7 dias
          goals: planData.steps.map(
            (step): CreateGoalDTO => ({
              description: step,
            }),
          ),
        };

        createdPlan = await this.plannerService.createPlan(
          createPlanDto,
          firebaseUid,
        );
      }

      // Retornar resposta
      const response: GPTConsultationResponseDto = {
        message: 'Consulta realizada com sucesso',
        gptResponse,
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

      return response;
    } catch (error) {
      this.log.error('Error in GPT consultation:', error);
      throw new Error('Erro ao consultar o GPT: ' + error.message);
    }
  }

  private buildPromptByMood(mood: MoodType, userMessage: string): string {
    const moodPrompts = {
      ansiedade: `Você é um assistente terapêutico especializado em ansiedade. O usuário está lidando com ansiedade e precisa de apoio e orientação. 

Responda de forma empática, compreensiva e ofereça estratégias práticas para lidar com a ansiedade. Se você achar que seria útil criar um plano de ação específico, inclua-o entre as tags <criarPlano> e </criarPlano> no formato JSON com as propriedades: title, description, steps (array de strings).

Mensagem do usuário: ${userMessage}`,

      impulsividade: `Você é um assistente terapêutico especializado em impulsividade. O usuário está lidando com comportamentos impulsivos e precisa de estratégias de autocontrole.

Responda de forma empática e ofereça técnicas práticas para gerenciar a impulsividade. Se você achar que seria útil criar um plano de ação específico, inclua-o entre as tags <criarPlano> e </criarPlano> no formato JSON com as propriedades: title, description, steps (array de strings).

Mensagem do usuário: ${userMessage}`,

      culpa: `Você é um assistente terapêutico especializado em sentimentos de culpa. O usuário está lidando com culpa e precisa de apoio para processar esses sentimentos.

Responda de forma empática, validando os sentimentos e oferecendo perspectivas saudáveis sobre a culpa. Se você achar que seria útil criar um plano de ação específico, inclua-o entre as tags <criarPlano> e </criarPlano> no formato JSON com as propriedades: title, description, steps (array de strings).

Mensagem do usuário: ${userMessage}`,

      vergonha: `Você é um assistente terapêutico especializado em sentimentos de vergonha. O usuário está lidando com vergonha e precisa de apoio para superar esses sentimentos.

Responda de forma empática, oferecendo validação e estratégias para lidar com a vergonha de forma saudável. Se você achar que seria útil criar um plano de ação específico, inclua-o entre as tags <criarPlano> e </criarPlano> no formato JSON com as propriedades: title, description, steps (array de strings).

Mensagem do usuário: ${userMessage}`,

      desesperança: `Você é um assistente terapêutico especializado em sentimentos de desesperança. O usuário está passando por um momento difícil e precisa de apoio e esperança.

Responda de forma empática, oferecendo perspectivas de esperança e estratégias para lidar com a desesperança. Se você achar que seria útil criar um plano de ação específico, inclua-o entre as tags <criarPlano> e </criarPlano> no formato JSON com as propriedades: title, description, steps (array de strings).

Mensagem do usuário: ${userMessage}`,
    };

    return moodPrompts[mood] || moodPrompts.ansiedade;
  }

  private extractPlanFromResponse(
    gptResponse: string,
  ): ExtractedPlanData | null {
    try {
      const planMatch = gptResponse.match(/<criarPlano>(.*?)<\/criarPlano>/s);

      if (!planMatch) {
        return null;
      }

      const planJson = planMatch[1].trim();
      const planData = JSON.parse(planJson);

      // Validar estrutura do plano
      if (
        !planData.title ||
        !planData.description ||
        !Array.isArray(planData.steps)
      ) {
        this.log.warn('Invalid plan structure:', planData);
        return null;
      }

      return {
        title: planData.title,
        description: planData.description,
        steps: planData.steps,
      };
    } catch (error) {
      this.log.error('Error extracting plan from response:', error);
      return null;
    }
  }
}
