import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { ConversationHistory } from '../entities/conversation-history.entity';
import { CreateConversationDto } from '../dtos/create-conversational-history.dto';

@Injectable()
export class ConversationService {
  private log: Logger = new Logger(ConversationService.name);
  constructor(
    @InjectRepository(ConversationHistory)
    private conversationRepository: Repository<ConversationHistory>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async create(
    createDto: CreateConversationDto,
    firebaseUid: string,
  ): Promise<ConversationHistory> {
    const profile: Profile = await this.profileRepository.findOneBy({
      firebaseUid,
    });
    if (!profile) {
      throw new NotFoundException('Profile not found!');
    }

    this.log.debug(createDto);

    const conversation = this.conversationRepository.create({
      mood: createDto.mood,
      userInput: createDto.userInput,
      gptResponse: createDto.gptResponse,
      profile,
    });

    this.log.debug(conversation);
    const result = await this.conversationRepository.save(conversation);
    return result;
  }

  async findAllByProfile(firebaseUid: string): Promise<ConversationHistory[]> {
    const profile: Profile = await this.profileRepository.findOneBy({
      firebaseUid,
    });
    if (!profile) {
      throw new NotFoundException('Profile not found!');
    }

    const profileId = profile.id;
    return this.conversationRepository.find({
      where: { profile: { id: profileId } },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteAllByProfile(firebaseUid: string): Promise<void> {
    const profile: Profile = await this.profileRepository.findOneBy({
      firebaseUid,
    });
    if (!profile) {
      throw new NotFoundException('Profile not found!');
    }

    const profileId = profile.id;
    await this.conversationRepository.delete({ profile: { id: profileId } });
  }
}
