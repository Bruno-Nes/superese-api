import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from './entities/folder.entity';
import { Diary } from './entities/diary.entity';
import { FolderController } from './controllers/folder.controller';
import { DiaryService } from './services/diary.service';
import { DiaryController } from './controllers/diary.controller';
import { UserModule } from '@modules/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Folder, Diary]), UserModule],
  controllers: [DiaryController, FolderController],
  providers: [DiaryService],
})
export class DiaryModule {}
