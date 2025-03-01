import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from './entities/folder.entity';
import { Diary } from './entities/diary.entity';
import { Entry } from './entities/entry.entity';
import { FolderController } from './controllers/folder.controller';
import { FolderService } from './services/folder.service';
import { DiaryService } from './services/diary.service';
import { DiaryController } from './controllers/diary.controller';
import { EntryService } from './services/entry.service';
import { EntryController } from './controllers/entry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Folder, Diary, Entry])],
  controllers: [DiaryController, FolderController, EntryController],
  providers: [DiaryService, FolderService, EntryService],
})
export class DiaryModule {}
