import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from '../entities/chat.entity';
import { Message } from '../entities/message.entity';
import { Profile } from '../entities/profile.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  /**
   * Criar ou recuperar um chat entre dois usuários
   */
  async getOrCreateChat(
    user1Id: string,
    user2Id: string,
    firebaseUid?: string,
  ): Promise<any> {
    // Buscar chat existente (independente da ordem dos usuários)

    const profile: Profile = await this.profileRepository.findOneBy({
      firebaseUid,
    });
    if (!profile) {
      throw new Error('Profile not found!');
    }

    const currentUserId = profile.id;

    let chat = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.user1', 'user1')
      .leftJoinAndSelect('chat.user2', 'user2')
      .where(
        '(chat.user1_id = :user1Id AND chat.user2_id = :user2Id) OR (chat.user1_id = :user2Id AND chat.user2_id = :user1Id)',
        { user1Id, user2Id },
      )
      .getOne();

    if (chat) {
      // Identificar o outro usuário baseado no currentUserId se fornecido
      const otherUser = currentUserId
        ? chat.user1.id === currentUserId
          ? chat.user2
          : chat.user1
        : null;

      return {
        id: chat.id,
        user1Id: chat.user1.id,
        user2Id: chat.user2.id,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        otherUser: otherUser
          ? {
              id: otherUser.id,
              username: otherUser.username,
              foto: otherUser.avatar,
            }
          : undefined,
      };
    }

    // Verificar se os usuários existem
    const user1 = await this.profileRepository.findOne({
      where: { id: user1Id },
    });
    const user2 = await this.profileRepository.findOne({
      where: { id: user2Id },
    });

    if (!user1) {
      throw new NotFoundException(`Usuário com ID ${user1Id} não encontrado`);
    }
    if (!user2) {
      throw new NotFoundException(`Usuário com ID ${user2Id} não encontrado`);
    }

    // Criar novo chat
    chat = this.chatRepository.create({
      user1,
      user2,
    });

    const savedChat = await this.chatRepository.save(chat);

    // Identificar o outro usuário baseado no currentUserId se fornecido
    const otherUser = currentUserId
      ? user1.id === currentUserId
        ? user2
        : user1
      : null;

    return {
      id: savedChat.id,
      user1Id: savedChat.user1.id,
      user2Id: savedChat.user2.id,
      createdAt: savedChat.createdAt,
      updatedAt: savedChat.updatedAt,
      otherUser: otherUser
        ? {
            id: otherUser.id,
            username: otherUser.username,
            foto: otherUser.avatar,
          }
        : undefined,
    };
  }

  /**
   * Enviar mensagem em um chat
   */
  async sendMessage(
    chatId: string,
    firebaseUid: string,
    content: string,
  ): Promise<any> {
    const profile: Profile = await this.profileRepository.findOneBy({
      firebaseUid,
    });
    if (!profile) {
      throw new Error('Profile not found!');
    }

    const senderId = profile.id;
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['user1', 'user2'],
    });

    if (!chat) {
      throw new NotFoundException('Chat não encontrado');
    }

    // Verificar se o sender é um dos participantes do chat
    if (chat.user1.id !== senderId && chat.user2.id !== senderId) {
      throw new NotFoundException('Usuário não é participante deste chat');
    }

    const sender = await this.profileRepository.findOne({
      where: { id: senderId },
    });

    if (!sender) {
      throw new NotFoundException('Remetente não encontrado');
    }

    const message = this.messageRepository.create({
      chat,
      sender,
      content,
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Atualizar updatedAt do chat
    chat.updatedAt = new Date();
    await this.chatRepository.save(chat);

    // Retornar mensagem com dados do sender
    return {
      id: savedMessage.id,
      content: savedMessage.content,
      senderId: savedMessage.sender.id,
      chatId: savedMessage.chat.id,
      createdAt: savedMessage.createdAt,
      isRead: savedMessage.isRead,
      sender: {
        id: sender.id,
        username: sender.username,
        foto: sender.avatar,
      },
    };
  }

  /**
   * Buscar novas mensagens com base no lastMessageId
   */
  async getNewMessages(chatId: string, lastMessageId?: number): Promise<any[]> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat não encontrado');
    }

    const query = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.chat', 'chat')
      .where('message.chat_id = :chatId', { chatId })
      .orderBy('message.id', 'ASC');

    if (lastMessageId) {
      query.andWhere('message.id > :lastMessageId', { lastMessageId });
    }

    const messages = await query.getMany();
    console.log('Mensagens novas:', messages);

    return messages.map((message) => ({
      id: message.id,
      content: message.content,
      senderId: message.sender.id,
      chatId: message.chat.id,
      createdAt: message.createdAt,
      isRead: message.isRead,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        foto: message.sender.avatar,
      },
    }));
  }

  /**
   * Buscar todos os chats de um usuário
   */
  async getUserChats(userId: string): Promise<any[]> {
    const chats = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.user1', 'user1')
      .leftJoinAndSelect('chat.user2', 'user2')
      .leftJoinAndSelect('chat.messages', 'messages')
      .leftJoinAndSelect('messages.sender', 'messageSender')
      .where('chat.user1_id = :userId OR chat.user2_id = :userId', { userId })
      .orderBy('chat.updatedAt', 'DESC')
      .addOrderBy('messages.id', 'DESC')
      .getMany();

    return chats.map((chat) => {
      // Identificar o outro usuário
      const otherUser = chat.user1.id === userId ? chat.user2 : chat.user1;

      // Encontrar última mensagem
      const lastMessage = chat.messages.length > 0 ? chat.messages[0] : null;

      // Contar mensagens não lidas enviadas pelo outro usuário
      const unreadCount = chat.messages.filter(
        (msg) => !msg.isRead && msg.sender.id !== userId,
      ).length;

      return {
        id: chat.id,
        user1Id: chat.user1.id,
        user2Id: chat.user2.id,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          foto: otherUser.avatar,
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.sender.id,
            }
          : null,
        unreadCount,
      };
    });
  }

  /**
   * Marcar mensagens como lidas
   */
  async markMessagesAsRead(chatId: string, userId: string): Promise<number> {
    const result = await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('chat_id = :chatId', { chatId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('isRead = false')
      .execute();

    return result.affected || 0;
  }

  /**
   * Buscar chat por ID com informações do outro usuário
   */
  async getChatById(chatId: string, firebaseUid: string): Promise<any> {
    const profile: Profile = await this.profileRepository.findOneBy({
      firebaseUid,
    });
    if (!profile) {
      throw new Error('Profile not found!');
    }

    const currentUserId = profile.id;
    const chat = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.user1', 'user1')
      .leftJoinAndSelect('chat.user2', 'user2')
      .leftJoinAndSelect('chat.messages', 'messages')
      .leftJoinAndSelect('messages.sender', 'messageSender')
      .where('chat.id = :chatId', { chatId })
      .andWhere(
        '(chat.user1_id = :currentUserId OR chat.user2_id = :currentUserId)',
        { currentUserId },
      )
      .orderBy('messages.id', 'DESC')
      .getOne();

    if (!chat) {
      throw new NotFoundException(
        'Chat não encontrado ou você não tem acesso a ele',
      );
    }

    // Identificar o outro usuário
    const otherUser = chat.user1.id === currentUserId ? chat.user2 : chat.user1;

    // Buscar última mensagem
    const lastMessage = chat.messages.length > 0 ? chat.messages[0] : null;

    return {
      id: chat.id,
      user1Id: chat.user1.id,
      user2Id: chat.user2.id,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      otherUser: {
        id: otherUser.id,
        username: otherUser.username,
        foto: otherUser.avatar,
      },
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
          }
        : null,
    };
  }

  /**
   * Buscar usuário por ID (dados básicos)
   */
  async getUserById(userId: string): Promise<any> {
    const user = await this.profileRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      foto: user.avatar,
      displayName: `${user.firstName} ${user.lastName}`.trim(),
    };
  }
}
