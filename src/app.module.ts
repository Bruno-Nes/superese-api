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

@Module({
  imports: [
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
    }),
    FirebaseModule.forRoot(),
    ScheduleModule.forRoot(),
    DatabaseModule,
    DiaryModule,
    ForumModule,
    FirebaseModule,
  ],
  controllers: [],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
