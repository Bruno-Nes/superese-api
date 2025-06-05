import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { UserModule } from '../user.module';
import { Chat } from '../entities/chat.entity';
import { Message } from '../entities/message.entity';
import { Profile } from '../entities/profile.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('Chat E2E', () => {
  let app: INestApplication;
  let chatRepository: Repository<Chat>;
  let messageRepository: Repository<Message>;
  let profileRepository: Repository<Profile>;

  const mockUser1 = {
    id: 'user1-uuid',
    username: 'user1',
    email: 'user1@test.com',
    firstName: 'User',
    lastName: 'One',
  };

  const mockUser2 = {
    id: 'user2-uuid',
    username: 'user2',
    email: 'user2@test.com',
    firstName: 'User',
    lastName: 'Two',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Chat, Message, Profile],
          synchronize: true,
        }),
        UserModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    chatRepository = moduleFixture.get<Repository<Chat>>(
      getRepositoryToken(Chat),
    );
    messageRepository = moduleFixture.get<Repository<Message>>(
      getRepositoryToken(Message),
    );
    profileRepository = moduleFixture.get<Repository<Profile>>(
      getRepositoryToken(Profile),
    );

    // Criar usuários de teste
    await profileRepository.save([mockUser1, mockUser2]);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Limpar dados entre testes
    await messageRepository.delete({});
    await chatRepository.delete({});
  });

  describe('/chat/create-or-get (POST)', () => {
    it('should create a new chat between two users', async () => {
      const response = await request(app.getHttpServer())
        .post('/chat/create-or-get')
        .send({
          user1Id: mockUser1.id,
          user2Id: mockUser2.id,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        user1: expect.objectContaining({ id: mockUser1.id }),
        user2: expect.objectContaining({ id: mockUser2.id }),
      });
      expect(response.body.id).toBeDefined();
    });

    it('should return existing chat when it already exists', async () => {
      // Primeiro, criar um chat
      const firstResponse = await request(app.getHttpServer())
        .post('/chat/create-or-get')
        .send({
          user1Id: mockUser1.id,
          user2Id: mockUser2.id,
        })
        .expect(201);

      // Tentar criar novamente o mesmo chat
      const secondResponse = await request(app.getHttpServer())
        .post('/chat/create-or-get')
        .send({
          user1Id: mockUser1.id,
          user2Id: mockUser2.id,
        })
        .expect(201);

      expect(firstResponse.body.id).toBe(secondResponse.body.id);
    });

    it('should return the same chat regardless of user order', async () => {
      // Criar chat com user1, user2
      const firstResponse = await request(app.getHttpServer())
        .post('/chat/create-or-get')
        .send({
          user1Id: mockUser1.id,
          user2Id: mockUser2.id,
        })
        .expect(201);

      // Criar chat com user2, user1 (ordem inversa)
      const secondResponse = await request(app.getHttpServer())
        .post('/chat/create-or-get')
        .send({
          user1Id: mockUser2.id,
          user2Id: mockUser1.id,
        })
        .expect(201);

      expect(firstResponse.body.id).toBe(secondResponse.body.id);
    });

    it('should return 404 when user does not exist', async () => {
      await request(app.getHttpServer())
        .post('/chat/create-or-get')
        .send({
          user1Id: 'non-existent-user',
          user2Id: mockUser2.id,
        })
        .expect(404);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/chat/create-or-get')
        .send({
          user1Id: '',
          user2Id: mockUser2.id,
        })
        .expect(400);
    });
  });

  describe('/chat/:chatId/send (POST)', () => {
    let chatId: string;

    beforeEach(async () => {
      // Criar um chat para os testes
      const chatResponse = await request(app.getHttpServer())
        .post('/chat/create-or-get')
        .send({
          user1Id: mockUser1.id,
          user2Id: mockUser2.id,
        });
      chatId = chatResponse.body.id;
    });

    it('should send a message successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/chat/${chatId}/send`)
        .send({
          senderId: mockUser1.id,
          content: 'Hello, this is a test message!',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        sender: expect.objectContaining({ id: mockUser1.id }),
        content: 'Hello, this is a test message!',
        isRead: false,
      });
      expect(response.body.id).toBeDefined();
    });

    it('should return 404 for non-existent chat', async () => {
      await request(app.getHttpServer())
        .post('/chat/non-existent-chat/send')
        .send({
          senderId: mockUser1.id,
          content: 'Test message',
        })
        .expect(404);
    });

    it('should return 404 when sender is not a participant', async () => {
      // Criar outro usuário
      const otherUser = await profileRepository.save({
        id: 'other-user-uuid',
        username: 'otheruser',
        email: 'other@test.com',
        firstName: 'Other',
        lastName: 'User',
      });

      await request(app.getHttpServer())
        .post(`/chat/${chatId}/send`)
        .send({
          senderId: otherUser.id,
          content: 'Test message',
        })
        .expect(404);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post(`/chat/${chatId}/send`)
        .send({
          senderId: '',
          content: 'Test message',
        })
        .expect(400);
    });
  });

  describe('/chat/:chatId/messages (GET)', () => {
    let chatId: string;

    beforeEach(async () => {
      // Criar um chat para os testes
      const chatResponse = await request(app.getHttpServer())
        .post('/chat/create-or-get')
        .send({
          user1Id: mockUser1.id,
          user2Id: mockUser2.id,
        });
      chatId = chatResponse.body.id;

      // Enviar algumas mensagens
      await request(app.getHttpServer()).post(`/chat/${chatId}/send`).send({
        senderId: mockUser1.id,
        content: 'First message',
      });

      await request(app.getHttpServer()).post(`/chat/${chatId}/send`).send({
        senderId: mockUser2.id,
        content: 'Second message',
      });

      await request(app.getHttpServer()).post(`/chat/${chatId}/send`).send({
        senderId: mockUser1.id,
        content: 'Third message',
      });
    });

    it('should get all messages when no lastMessageId is provided', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/${chatId}/messages`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].content).toBe('First message');
      expect(response.body[1].content).toBe('Second message');
      expect(response.body[2].content).toBe('Third message');
    });

    it('should get messages after lastMessageId when provided', async () => {
      // Primeiro, obter todas as mensagens para pegar o ID da primeira
      const allMessagesResponse = await request(app.getHttpServer())
        .get(`/chat/${chatId}/messages`)
        .expect(200);

      const firstMessageId = allMessagesResponse.body[0].id;

      // Agora buscar mensagens após a primeira
      const response = await request(app.getHttpServer())
        .get(`/chat/${chatId}/messages?lastMessageId=${firstMessageId}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].content).toBe('Second message');
      expect(response.body[1].content).toBe('Third message');
    });

    it('should return 404 for non-existent chat', async () => {
      await request(app.getHttpServer())
        .get('/chat/non-existent-chat/messages')
        .expect(404);
    });
  });

  describe('/chat/user/:userId (GET)', () => {
    beforeEach(async () => {
      // Criar alguns chats para o usuário
      await request(app.getHttpServer()).post('/chat/create-or-get').send({
        user1Id: mockUser1.id,
        user2Id: mockUser2.id,
      });

      // Criar outro usuário e outro chat
      const otherUser = await profileRepository.save({
        id: 'other-user-uuid',
        username: 'otheruser',
        email: 'other@test.com',
        firstName: 'Other',
        lastName: 'User',
      });

      await request(app.getHttpServer()).post('/chat/create-or-get').send({
        user1Id: mockUser1.id,
        user2Id: otherUser.id,
      });
    });

    it('should get all chats for a user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/user/${mockUser1.id}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(
        response.body.every(
          (chat) =>
            chat.user1.id === mockUser1.id || chat.user2.id === mockUser1.id,
        ),
      ).toBe(true);
    });
  });

  describe('/chat/:chatId/mark-read (POST)', () => {
    let chatId: string;

    beforeEach(async () => {
      // Criar um chat e algumas mensagens
      const chatResponse = await request(app.getHttpServer())
        .post('/chat/create-or-get')
        .send({
          user1Id: mockUser1.id,
          user2Id: mockUser2.id,
        });
      chatId = chatResponse.body.id;

      // Enviar mensagem do user2 para user1
      await request(app.getHttpServer()).post(`/chat/${chatId}/send`).send({
        senderId: mockUser2.id,
        content: 'Unread message',
      });
    });

    it('should mark messages as read successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/chat/${chatId}/mark-read`)
        .send({
          userId: mockUser1.id,
        })
        .expect(201);

      expect(response.body).toEqual({
        message: 'Mensagens marcadas como lidas',
      });
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post(`/chat/${chatId}/mark-read`)
        .send({
          userId: '',
        })
        .expect(400);
    });
  });
});
