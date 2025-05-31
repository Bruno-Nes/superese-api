import { Injectable, NotFoundException } from '@nestjs/common';
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

    if (!sender) {
      throw new NotFoundException('Remetente não encontrado');
    }
    if (!receiver) {
      throw new NotFoundException('Destinatário não encontrado');
    }

    const message = this.messageRepo.create({ content, sender, receiver });
    const savedMessage = await this.messageRepo.save(message);

    // Retorna a mensagem com as relações carregadas
    return this.messageRepo.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'receiver'],
    });
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string) {
    return this.messageRepo.find({
      where: [
        { sender: { id: user1Id }, receiver: { id: user2Id } },
        { sender: { id: user2Id }, receiver: { id: user1Id } },
      ],
      relations: ['sender', 'receiver'],
      order: { createdAt: 'ASC' },
    });
  }

  async getConversations(userId: string) {
    // Buscar todas as mensagens onde o usuário é remetente ou destinatário
    const conversations = await this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where('message.senderId = :userId OR message.receiverId = :userId', {
        userId: userId,
      })
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    // Agrupar por conversa e pegar a última mensagem de cada
    const conversationMap = new Map();

    for (const message of conversations) {
      const otherUserId =
        message.sender.id === userId ? message.receiver.id : message.sender.id;

      if (!conversationMap.has(otherUserId)) {
        // Contar mensagens não lidas
        const unreadCount = await this.messageRepo.count({
          where: {
            sender: { id: otherUserId },
            receiver: { id: userId },
            isRead: false,
          },
        });

        conversationMap.set(otherUserId, {
          otherUser:
            message.sender.id === userId ? message.receiver : message.sender,
          lastMessage: message,
          unreadCount,
        });
      }
    }

    return Array.from(conversationMap.values());
  }

  async markMessagesAsRead(senderId: string, receiverId: string) {
    await this.messageRepo.update(
      {
        sender: { id: senderId },
        receiver: { id: receiverId },
        isRead: false,
      },
      { isRead: true },
    );
  }

  async deleteMessage(messageId: number, userId: string) {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    if (message.sender.id !== userId) {
      throw new Error('Usuário não autorizado a deletar esta mensagem');
    }

    await this.messageRepo.remove(message);
    return { success: true, message: 'Mensagem deletada com sucesso' };
  }
}
