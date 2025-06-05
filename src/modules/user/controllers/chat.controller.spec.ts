import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from '../controllers/message.controller';
import { ChatService } from '../services/chat.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateOrGetChatDto,
  SendMessageDto,
  MarkAsReadDto,
} from '../dtos/chat.dto';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;

  const mockChatService = {
    getOrCreateChat: jest.fn(),
    sendMessage: jest.fn(),
    getNewMessages: jest.fn(),
    getUserChats: jest.fn(),
    markMessagesAsRead: jest.fn(),
  };

  const mockChat = {
    id: 'chat1',
    user1: { id: 'user1', username: 'user1' },
    user2: { id: 'user2', username: 'user2' },
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMessage = {
    id: 1,
    chat: mockChat,
    sender: { id: 'user1', username: 'user1' },
    content: 'Test message',
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOrCreateChat', () => {
    it('should create or get chat successfully', async () => {
      const createOrGetChatDto: CreateOrGetChatDto = {
        user1Id: 'user1',
        user2Id: 'user2',
      };

      mockChatService.getOrCreateChat.mockResolvedValue(mockChat);

      const result = await controller.getOrCreateChat(createOrGetChatDto);

      expect(result).toEqual(mockChat);
      expect(chatService.getOrCreateChat).toHaveBeenCalledWith(
        'user1',
        'user2',
      );
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const sendMessageDto: SendMessageDto = {
        senderId: 'user1',
        content: 'Test message',
      };

      mockChatService.sendMessage.mockResolvedValue(mockMessage);

      const result = await controller.sendMessage('chat1', sendMessageDto);

      expect(result).toEqual(mockMessage);
      expect(chatService.sendMessage).toHaveBeenCalledWith(
        'chat1',
        'user1',
        'Test message',
      );
    });
  });

  describe('getNewMessages', () => {
    it('should get new messages without lastMessageId', async () => {
      const messages = [mockMessage];
      mockChatService.getNewMessages.mockResolvedValue(messages);

      const result = await controller.getNewMessages('chat1');

      expect(result).toEqual(messages);
      expect(chatService.getNewMessages).toHaveBeenCalledWith(
        'chat1',
        undefined,
      );
    });

    it('should get new messages with lastMessageId', async () => {
      const messages = [mockMessage];
      mockChatService.getNewMessages.mockResolvedValue(messages);

      const result = await controller.getNewMessages('chat1', '5');

      expect(result).toEqual(messages);
      expect(chatService.getNewMessages).toHaveBeenCalledWith('chat1', 5);
    });
  });

  describe('getUserChats', () => {
    it('should get user chats successfully', async () => {
      const chats = [mockChat];
      mockChatService.getUserChats.mockResolvedValue(chats);

      const result = await controller.getUserChats('user1');

      expect(result).toEqual(chats);
      expect(chatService.getUserChats).toHaveBeenCalledWith('user1');
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read successfully', async () => {
      const markAsReadDto: MarkAsReadDto = {
        userId: 'user1',
      };

      mockChatService.markMessagesAsRead.mockResolvedValue(undefined);

      const result = await controller.markAsRead('chat1', markAsReadDto);

      expect(result).toEqual({ message: 'Mensagens marcadas como lidas' });
      expect(chatService.markMessagesAsRead).toHaveBeenCalledWith(
        'chat1',
        'user1',
      );
    });
  });
});
