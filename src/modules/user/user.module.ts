import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { JwtModule } from '@nestjs/jwt';
import { Profile } from './entities/profile.entity';
import { OpenAIModule } from '@modules/openai/openai.module';
import { FriendshipController } from './controllers/friendship.controller';
import { FriendshipService } from './services/friendship.service';
import { RecoveryStatus } from './entities/recovery-status.entity';
import { RecoveryStatusController } from './controllers/recovery-status.controller';
import { RecoveryStatusService } from './services/recovery-status.service';
import { NewsController } from './controllers/news.controller';
import { NewsService } from './services/news.service';
import { Message } from './entities/message.entity';
import { ChatGateway } from './chat-gateway/chat.gateway';
import { MessageService } from './services/message.service';
import { ConversationController } from './controllers/conversarion-history.controller';
import { ConversationService } from './services/conversation-history.service';
import { ConversationHistory } from './entities/conversation-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      Friendship,
      ConversationHistory,
      RecoveryStatus,
      Message,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1d' },
    }),
    OpenAIModule.forRoot(),
  ],
  controllers: [
    UserController,
    FriendshipController,
    RecoveryStatusController,
    NewsController,
    ConversationController,
  ],
  providers: [
    UserService,
    FriendshipService,
    RecoveryStatusService,
    NewsService,
    ChatGateway,
    MessageService,
    ConversationService,
  ],
  exports: [UserService],
})
export class UserModule {}
