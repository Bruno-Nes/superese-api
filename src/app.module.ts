import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { DiaryModule } from './modules/diary/diary.module';
import { ForumModule } from './modules/forum/forum.module';
import { DatabaseModule } from './config/typeorm';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    DiaryModule,
    ForumModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
