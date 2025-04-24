import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { JwtModule } from '@nestjs/jwt';
import { Profile } from './entities/profile.entity';
import { MotivacionalPhrasesService } from './services/motivacional-phrases.service';
import { MotivacionalPhrases } from './entities/motivacional-phrases.entity';
import { OpenAIModule } from '@modules/openai/openai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, Friendship, MotivacionalPhrases]),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1d' },
    }),
    OpenAIModule.forRoot(),
  ],
  controllers: [UserController],
  providers: [UserService, MotivacionalPhrasesService],
  exports: [UserService],
})
export class UserModule {}
