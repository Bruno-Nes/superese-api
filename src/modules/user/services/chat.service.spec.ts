import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Chat } from '../entities/chat.entity';
import { Message } from '../entities/message.entity';
import { Profile } from '../entities/profile.entity';

describe('ChatService', () => {
  let service: ChatService;
  let chatRepository: Repository<Chat>;
  let messageRepository: Repository<Message>;
  let profileRepository: Repository<Profile>;

  const mockProfile1 = {
    id: 'user1',
    username: 'user1',
    email: 'user1@test.com',
  } as Profile;

  const mockProfile2 = {
    id: 'user2',
    username: 'user2',
    email: 'user2@test.com',
  } as Profile;

  const mockChat = {
    id: 'chat1',
    user1: mockProfile1,
    user2: mockProfile2,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Chat;

  const mockMessage = {
    id: 1,
    chat: mockChat,
    sender: mockProfile1,
    content: 'Test message',
    isRead: false,
    createdAt: new Date(),
  } as Message;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(Chat),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Message),
          useValue: {
            createQueryBuilder: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    chatRepository = module.get<Repository<Chat>>(getRepositoryToken(Chat));
    messageRepository = module.get<Repository<Message>>(
      getRepositoryToken(Message),
    );
    profileRepository = module.get<Repository<Profile>>(
      getRepositoryToken(Profile),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateChat', () => {
    it('should return existing chat when found', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockChat),
      };
      jest
        .spyOn(chatRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.getOrCreateChat('user1', 'user2');

      expect(result).toEqual(mockChat);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        '(chat.user1_id = :user1Id AND chat.user2_id = :user2Id) OR (chat.user1_id = :user2Id AND chat.user2_id = :user1Id)',
        { user1Id: 'user1', user2Id: 'user2' },
      );
    });

    it('should create new chat when none exists', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      jest
        .spyOn(chatRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);
      jest
        .spyOn(profileRepository, 'findOne')
        .mockResolvedValueOnce(mockProfile1)
        .mockResolvedValueOnce(mockProfile2);
      jest.spyOn(chatRepository, 'create').mockReturnValue(mockChat);
      jest.spyOn(chatRepository, 'save').mockResolvedValue(mockChat);

      const result = await service.getOrCreateChat('user1', 'user2');

      expect(result).toEqual(mockChat);
      expect(chatRepository.create).toHaveBeenCalledWith({
        user1: mockProfile1,
        user2: mockProfile2,
      });
      expect(chatRepository.save).toHaveBeenCalledWith(mockChat);
    });

    it('should throw NotFoundException when user1 not found', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      jest
        .spyOn(chatRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);
      jest.spyOn(profileRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getOrCreateChat('user1', 'user2')).rejects.toThrow(
        new NotFoundException('Usuário com ID user1 não encontrado'),
      );
    });

    it('should throw NotFoundException when user2 not found', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      jest
        .spyOn(chatRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);
      jest
        .spyOn(profileRepository, 'findOne')
        .mockResolvedValueOnce(mockProfile1)
        .mockResolvedValueOnce(null);

      await expect(service.getOrCreateChat('user1', 'user2')).rejects.toThrow(
        new NotFoundException('Usuário com ID user2 não encontrado'),
      );
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      jest.spyOn(chatRepository, 'findOne').mockResolvedValue(mockChat);
      jest.spyOn(profileRepository, 'findOne').mockResolvedValue(mockProfile1);
      jest.spyOn(messageRepository, 'create').mockReturnValue(mockMessage);
      jest.spyOn(messageRepository, 'save').mockResolvedValue(mockMessage);

      const result = await service.sendMessage(
        'chat1',
        'user1',
        'Test message',
      );

      expect(result).toEqual(mockMessage);
      expect(messageRepository.create).toHaveBeenCalledWith({
        chat: mockChat,
        sender: mockProfile1,
        content: 'Test message',
        isRead: false,
      });
    });

    it('should throw NotFoundException when chat not found', async () => {
      jest.spyOn(chatRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.sendMessage('chat1', 'user1', 'Test message'),
      ).rejects.toThrow(new NotFoundException('Chat não encontrado'));
    });

    it('should throw NotFoundException when sender is not participant', async () => {
      const chatWithDifferentUsers = {
        ...mockChat,
        user1: { id: 'other1' } as Profile,
        user2: { id: 'other2' } as Profile,
      };
      jest
        .spyOn(chatRepository, 'findOne')
        .mockResolvedValue(chatWithDifferentUsers);

      await expect(
        service.sendMessage('chat1', 'user1', 'Test message'),
      ).rejects.toThrow(
        new NotFoundException('Usuário não é participante deste chat'),
      );
    });

    it('should throw NotFoundException when sender not found', async () => {
      jest.spyOn(chatRepository, 'findOne').mockResolvedValue(mockChat);
      jest.spyOn(profileRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.sendMessage('chat1', 'user1', 'Test message'),
      ).rejects.toThrow(new NotFoundException('Remetente não encontrado'));
    });
  });

  describe('getNewMessages', () => {
    it('should get messages without lastMessageId', async () => {
      jest.spyOn(chatRepository, 'findOne').mockResolvedValue(mockChat);
      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockMessage]),
      };
      jest
        .spyOn(messageRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.getNewMessages('chat1');

      expect(result).toEqual([mockMessage]);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'message.chat_id = :chatId',
        { chatId: 'chat1' },
      );
    });

    it('should get messages with lastMessageId', async () => {
      jest.spyOn(chatRepository, 'findOne').mockResolvedValue(mockChat);
      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockMessage]),
      };
      jest
        .spyOn(messageRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.getNewMessages('chat1', 5);

      expect(result).toEqual([mockMessage]);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'message.id > :lastMessageId',
        { lastMessageId: 5 },
      );
    });

    it('should throw NotFoundException when chat not found', async () => {
      jest.spyOn(chatRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getNewMessages('chat1')).rejects.toThrow(
        new NotFoundException('Chat não encontrado'),
      );
    });
  });

  describe('getUserChats', () => {
    it('should get user chats successfully', async () => {
      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockChat]),
      };
      jest
        .spyOn(chatRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.getUserChats('user1');

      expect(result).toEqual([mockChat]);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'chat.user1_id = :userId OR chat.user2_id = :userId',
        { userId: 'user1' },
      );
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read successfully', async () => {
      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      jest
        .spyOn(messageRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await service.markMessagesAsRead('chat1', 'user1');

      expect(queryBuilder.set).toHaveBeenCalledWith({ isRead: true });
      expect(queryBuilder.where).toHaveBeenCalledWith('chat_id = :chatId', {
        chatId: 'chat1',
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'sender_id != :userId',
        { userId: 'user1' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('isRead = false');
    });
  });
});
