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
import { EventEmitter2 } from '@nestjs/event-emitter';

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
      console.log('🤖 GPT Response completa:', gptResponse);

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
      console.log('📋 Dados do plano extraídos:', planData);
      let createdPlan: Plan | null = null;

      if (planData) {
        console.log('✅ Plano detectado, criando no banco...');
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

        console.log('📝 DTO do plano:', createPlanDto);
        createdPlan = await this.plannerService.createPlan(
          createPlanDto,
          firebaseUid,
        );
        console.log('🎯 Plano criado com sucesso:', createdPlan);
      } else {
        console.log('❌ Nenhum plano foi detectado na resposta do GPT');
      }

      // Emitir evento para conquista de busca por ajuda da IA
      this.eventEmitter.emit('gpt.consultation.help', {
        profileId: firebaseUid,
        actionType: 'ai_help_seeking',
        data: {
          conversationType: 'ai_help',
          mood,
          planCreated: !!createdPlan,
        },
      });

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
    console.log('🔍 Iniciando extração de plano da resposta...');
    console.log('📄 Resposta do GPT para análise:', gptResponse);

    try {
      const planMatch = gptResponse.match(/<criarPlano>(.*?)<\/criarPlano>/s);
      console.log('🎯 Regex match result:', planMatch);

      if (!planMatch) {
        console.log('❌ Nenhum plano encontrado nas tags <criarPlano>');
        return null;
      }

      const planJson = planMatch[1].trim();
      console.log('📝 JSON extraído:', planJson);

      const planData = JSON.parse(planJson);
      console.log('📊 Dados do plano parseados:', planData);

      // Validar estrutura do plano
      if (
        !planData.title ||
        !planData.description ||
        !Array.isArray(planData.steps)
      ) {
        console.log('⚠️ Estrutura do plano inválida:', planData);
        this.log.warn('Invalid plan structure:', planData);
        return null;
      }

      console.log('✅ Plano extraído com sucesso:', planData);
      return {
        title: planData.title,
        description: planData.description,
        steps: planData.steps,
      };
    } catch (error) {
      console.log('💥 Erro ao extrair plano:', error);
      this.log.error('Error extracting plan from response:', error);
      return null;
    }
  }

  async gerarRelatorioMotivacional(
    planId: string,
    firebaseUid: string,
  ): Promise<{ relatorio: string }> {
    console.log('🎯 Gerando relatório motivacional para o plano:', planId);

    try {
      // Buscar o plano com todas as informações necessárias
      const plano = await this.plannerService.findAllByProfile(firebaseUid);
      const planoEspecifico = plano.find((p) => p.id === planId);

      if (!planoEspecifico) {
        throw new Error('Plano não encontrado ou não pertence ao usuário');
      }

      console.log('📊 Plano encontrado:', planoEspecifico);

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

      // Construir prompt motivacional
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

      console.log('📝 Prompt gerado para relatório:', prompt);

      // Consultar OpenAI para gerar o relatório
      const relatorioMotivacional = await this.openAIService.create(prompt);

      console.log('✅ Relatório motivacional gerado com sucesso');
      console.log(
        '📄 Conteúdo do relatório:',
        relatorioMotivacional.substring(0, 200) + '...',
      );

      return {
        relatorio: relatorioMotivacional,
      };
    } catch (error) {
      this.log.error('Error generating motivational report:', error);
      throw new Error('Erro ao gerar relatório motivacional: ' + error.message);
    }
  }
}
