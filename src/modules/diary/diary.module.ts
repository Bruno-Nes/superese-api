import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from './entities/folder.entity';
import { Diary } from './entities/diary.entity';
import { FolderController } from './controllers/folder.controller';
import { FolderService } from './services/folder.service';
import { DiaryService } from './services/diary.service';
import { DiaryController } from './controllers/diary.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Folder, Diary])],
  controllers: [DiaryController, FolderController],
  providers: [DiaryService, FolderService],
})
export class DiaryModule {}
