import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { DiaryService } from '../services/diary.service';
import { CreateDiaryDto } from '../dtos/create-diary.dto';
import { UpdateDiaryDto } from '../dtos/update-diary.dto';

@Controller('folders/:folderId/diaries')
@UseGuards(JwtAuthGuard)
export class DiaryController {
  constructor(private readonly diariesService: DiaryService) {}

  @Post()
  create(
    @Param('folderId') folderId: string,
    @Body() createDiaryDto: CreateDiaryDto,
  ) {
    return this.diariesService.create(folderId, createDiaryDto);
  }

  @Get()
  findAll(@Param('folderId') folderId: string) {
    return this.diariesService.findAll(folderId);
  }

  @Get(':id')
  findOne(@Param('folderId') folderId: string, @Param('id') id: string) {
    return this.diariesService.findOne(id, folderId);
  }

  @Patch(':id')
  update(
    @Param('folderId') folderId: string,
    @Param('id') id: string,
    @Body() updateDiaryDto: UpdateDiaryDto,
  ) {
    return this.diariesService.update(id, folderId, updateDiaryDto);
  }

  @Delete(':id')
  remove(@Param('folderId') folderId: string, @Param('id') id: string) {
    return this.diariesService.remove(id, folderId);
  }
}
