import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { DiaryModule } from './modules/diary/diary.module';
import { ForumModule } from './modules/forum/forum.module';
import { DatabaseModule } from './config/typeorm';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { AuthGuard } from '@modules/auth/guards/auth.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PlannerModule } from '@modules/planner/planner.module';
import { NotificationModule } from './modules/notification/notification.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    FirebaseModule.forRoot(),
    ScheduleModule.forRoot(),
    DatabaseModule,
    DiaryModule,
    ForumModule,
    PlannerModule,
    NotificationModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
