import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from '../entities/message.entity';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(Profile) private userRepo: Repository<Profile>,
  ) {}

  async createMessage({
    senderId,
    receiverId,
    content,
  }: {
    senderId: string;
    receiverId: string;
    content: string;
  }) {
    const sender = await this.userRepo.findOneBy({ id: senderId });
    const receiver = await this.userRepo.findOneBy({ id: receiverId });

    const message = this.messageRepo.create({ content, sender, receiver });
    return this.messageRepo.save(message);
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string) {
    return this.messageRepo.find({
      where: [
        { sender: { id: user1Id }, receiver: { id: user2Id } },
        { sender: { id: user2Id }, receiver: { id: user1Id } },
      ],
      order: { createdAt: 'ASC' },
    });
  }
}
