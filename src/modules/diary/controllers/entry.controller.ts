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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Entries')
@ApiBearerAuth()
@Controller('diaries/:diaryId/entries')
@UseGuards(JwtAuthGuard)
export class EntryController {
  constructor(private readonly entriesService: EntryService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova entrada dentro de um diário' })
  @ApiParam({
    name: 'diaryId',
    description: 'ID do diário ao qual a entrada pertence',
  })
  create(
    @Param('diaryId') diaryId: string,
    @Body() createEntryDto: CreateEntryDto,
  ) {
    return this.entriesService.create(diaryId, createEntryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as entradas de um diário' })
  @ApiParam({ name: 'diaryId', description: 'ID do diário' })
  findAll(@Param('diaryId') diaryId: string) {
    return this.entriesService.findAll(diaryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém detalhes de uma entrada específica' })
  @ApiParam({ name: 'diaryId', description: 'ID do diário' })
  @ApiParam({ name: 'id', description: 'ID da entrada' })
  findOne(@Param('diaryId') diaryId: string, @Param('id') id: string) {
    return this.entriesService.findOne(id, diaryId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma entrada de um diário' })
  @ApiParam({ name: 'diaryId', description: 'ID do diário' })
  @ApiParam({ name: 'id', description: 'ID da entrada' })
  update(
    @Param('diaryId') diaryId: string,
    @Param('id') id: string,
    @Body() updateEntryDto: UpdateEntryDto,
  ) {
    return this.entriesService.update(id, diaryId, updateEntryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma entrada de um diário' })
  @ApiParam({ name: 'diaryId', description: 'ID do diário' })
  @ApiParam({ name: 'id', description: 'ID da entrada' })
  remove(@Param('diaryId') diaryId: string, @Param('id') id: string) {
    return this.entriesService.remove(id, diaryId);
  }
}
