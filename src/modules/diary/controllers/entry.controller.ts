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
import { CreateEntryDto } from '../dtos/create-entry.dto';
import { EntryService } from '../services/entry.service';
import { UpdateEntryDto } from '../dtos/update-entry.dto';

@Controller('diaries/:diaryId/entries')
@UseGuards(JwtAuthGuard)
export class EntryController {
  constructor(private readonly entriesService: EntryService) {}

  @Post()
  create(
    @Param('diaryId') diaryId: string,
    @Body() createEntryDto: CreateEntryDto,
  ) {
    return this.entriesService.create(diaryId, createEntryDto);
  }

  @Get()
  findAll(@Param('diaryId') diaryId: string) {
    return this.entriesService.findAll(diaryId);
  }

  @Get(':id')
  findOne(@Param('diaryId') diaryId: string, @Param('id') id: string) {
    return this.entriesService.findOne(id, diaryId);
  }

  @Patch(':id')
  update(
    @Param('diaryId') diaryId: string,
    @Param('id') id: string,
    @Body() updateEntryDto: UpdateEntryDto,
  ) {
    return this.entriesService.update(id, diaryId, updateEntryDto);
  }

  @Delete(':id')
  remove(@Param('diaryId') diaryId: string, @Param('id') id: string) {
    return this.entriesService.remove(id, diaryId);
  }
}
