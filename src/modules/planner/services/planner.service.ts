import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Plan } from '../entities/plan.entity';
import { Goal } from '../entities/goal.entity';
import { Observation } from '../entities/observation.entity';
import { MotivationalReport } from '../entities/motivational-report.entity';
import { CreatePlanDTO } from '../dtos/create-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from '@modules/user/entities/profile.entity';
import { CreateGoalDTO } from '../dtos/create-goal.dto';
import { MotivationalReportResponseDto } from '../dtos/motivational-report-response.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PlannerService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,

    @InjectRepository(Observation)
    private readonly observationRepository: Repository<Observation>,

    @InjectRepository(MotivationalReport)
    private readonly motivationalReportRepository: Repository<MotivationalReport>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPlan(input: CreatePlanDTO, firebaseUid: string) {
    console.log('Creating plan with input:', input);
    const profile: Profile = await this.profileRepository.findOneBy({
      firebaseUid,
    });
    if (!profile) {
      throw new NotFoundException('Profile not foung!');
    }

    const { duration, description, goals } = input;

    const plan = this.planRepository.create({
      description,
      duration,
      progress: 0,
      completed: false,
      profile,
    });
    console.log('Plan created:', plan);

    // Salvar o plano primeiro para obter o ID
    const savedPlan = await this.planRepository.save(plan);

    const newGoals = goals.map((goal) => {
      // Handle both string and CreateGoalDTO formats
      const description = typeof goal === 'string' ? goal : goal.description;

      return {
        description,
      };
    });

    await this.createGoals(newGoals, savedPlan.id);

    return savedPlan;
  }

  async increaseProgress(planId: string, observationText?: string) {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
      relations: ['profile'],
    });
    if (!plan) {
      throw new Error('Plan not found!');
    }

    const wasCompleted = plan.completed;

    if (!plan.completed) {
      plan.progress += 1;
    }

    if (plan.progress === plan.duration) {
      plan.completed = true;
    }

    await this.planRepository.save(plan);

    // Emitir evento de progresso
    this.eventEmitter.emit('plan.progress.updated', {
      profileId: plan.profile.id,
      planId: plan.id,
      progressType: 'increase',
      currentProgress: plan.progress,
      duration: plan.duration,
    });

    // Emitir evento de conclusão se acabou de ser completado
    if (!wasCompleted && plan.completed) {
      this.eventEmitter.emit('plan.completed', {
        profileId: plan.profile.id,
        planId: plan.id,
        duration: plan.duration,
      });
    }

    // Criar observação se o texto foi fornecido
    if (observationText && observationText.trim()) {
      const observation = this.observationRepository.create({
        text: observationText.trim(),
        plan,
      });
      await this.observationRepository.save(observation);
    }
  }

  async decreaseProgress(planId: string) {
    const plan = await this.planRepository.findOneBy({ id: planId });
    if (!plan) {
      throw new Error('Plan not found!');
    }

    if (plan.completed) {
      plan.completed = false;
    }

    plan.progress -= 1;

    if (plan.progress < 1) {
      plan.progress = 0;
    }

    await this.planRepository.save(plan);

    // Remover a última observação deste plano
    const lastObservation = await this.observationRepository.findOne({
      where: { plan: { id: planId } },
      order: { createdAt: 'DESC' },
    });

    if (lastObservation) {
      await this.observationRepository.remove(lastObservation);
    }
  }

  async findAllByProfile(firebaseUid: string): Promise<Plan[]> {
    const profile: Profile = await this.profileRepository.findOneBy({
      firebaseUid,
    });
    if (!profile) {
      throw new NotFoundException('Profile not foung!');
    }

    const profileId = profile.id;

    return this.planRepository.find({
      where: {
        profile: { id: profileId },
      },
      relations: ['goals', 'observations'],
      order: {
        observations: {
          createdAt: 'ASC',
        },
      },
    });
  }

  async createGoals(goals: CreateGoalDTO[], planId: string) {
    const plan = await this.planRepository.findOneBy({ id: planId });
    if (!plan) {
      throw new NotFoundException('Plan not found!');
    }
    if (goals.length < 1) {
      throw new Error('Therer is no goals to save');
    }
    goals = goals.map((goal) => {
      return this.goalRepository.create({
        description: goal.description,
        plan,
      });
    });
    return await this.goalRepository.insert(goals);
  }

  async deletePlan(planId: string, firebaseUid: string) {
    // Verificar se o perfil existe
    const profile: Profile = await this.profileRepository.findOneBy({
      firebaseUid,
    });
    if (!profile) {
      throw new NotFoundException('Profile not found!');
    }

    // Buscar o plano com suas metas
    const plan = await this.planRepository.findOne({
      where: { id: planId, profile: { id: profile.id } },
      relations: ['goals'],
    });

    if (!plan) {
      throw new NotFoundException(
        'Plan not found or does not belong to this user!',
      );
    }

    // Deletar o plano (as metas serão deletadas automaticamente devido ao cascade)
    await this.planRepository.remove(plan);

    return {
      success: true,
      message: 'Plan and its goals deleted successfully',
    };
  }

  /**
   * Salvar relatório motivacional para um plano
   */
  async saveMotivationalReport(
    planId: string,
    content: string,
    firebaseUid: string,
  ): Promise<MotivationalReportResponseDto> {
    // Verificar se o plano existe e pertence ao usuário
    const profile = await this.profileRepository.findOneBy({ firebaseUid });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const plan = await this.planRepository.findOne({
      where: { id: planId, profile: { id: profile.id } },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found or does not belong to user');
    }

    // Verificar se já existe um relatório para este plano
    const existingReport = await this.motivationalReportRepository.findOne({
      where: { planId },
    });

    if (existingReport) {
      // Atualizar o relatório existente
      existingReport.content = content;
      existingReport.updatedAt = new Date();
      const updatedReport =
        await this.motivationalReportRepository.save(existingReport);

      return {
        id: updatedReport.id,
        content: updatedReport.content,
        planId: updatedReport.planId,
        createdAt: updatedReport.createdAt,
      };
    } else {
      // Criar novo relatório
      const motivationalReport = this.motivationalReportRepository.create({
        content,
        planId,
        plan,
      });

      const savedReport =
        await this.motivationalReportRepository.save(motivationalReport);

      return {
        id: savedReport.id,
        content: savedReport.content,
        planId: savedReport.planId,
        createdAt: savedReport.createdAt,
      };
    }
  }

  /**
   * Buscar relatório motivacional por planId
   */
  async getMotivationalReportByPlanId(
    planId: string,
    firebaseUid: string,
  ): Promise<MotivationalReportResponseDto | null> {
    // Verificar se o plano pertence ao usuário
    const profile = await this.profileRepository.findOneBy({ firebaseUid });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const plan = await this.planRepository.findOne({
      where: { id: planId, profile: { id: profile.id } },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found or does not belong to user');
    }

    // Buscar o relatório
    const report = await this.motivationalReportRepository.findOne({
      where: { planId },
    });

    if (!report) {
      return null;
    }

    return {
      id: report.id,
      content: report.content,
      planId: report.planId,
      createdAt: report.createdAt,
    };
  }
}
