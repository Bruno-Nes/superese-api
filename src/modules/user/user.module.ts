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
import { Chat } from './entities/chat.entity';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/message.controller';
import { ConversationController } from './controllers/conversarion-history.controller';
import { ConversationService } from './services/conversation-history.service';
import { ConversationHistory } from './entities/conversation-history.entity';
import { GPTConsultationService } from './services/gpt-consultation.service';
import { GPTConsultationController } from './controllers/gpt-consultation.controller';
import { PlannerModule } from '../planner/planner.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      Friendship,
      ConversationHistory,
      RecoveryStatus,
      Message,
      Chat,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1d' },
    }),
    OpenAIModule.forRoot(),
    PlannerModule,
    AchievementsModule,
  ],
  controllers: [
    UserController,
    FriendshipController,
    RecoveryStatusController,
    NewsController,
    ChatController,
    ConversationController,
    GPTConsultationController,
  ],
  providers: [
    UserService,
    FriendshipService,
    RecoveryStatusService,
    NewsService,
    ChatService,
    ConversationService,
    GPTConsultationService,
  ],
  exports: [UserService],
})
export class UserModule {}
