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
import { DiaryService } from '../services/diary.service';
import { CreateDiaryDto } from '../dtos/create-diary.dto';
import { UpdateDiaryDto } from '../dtos/update-diary.dto';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@modules/auth/guards/auth.guard';

@ApiTags('Diaries')
@Controller('diaries')
export class DiaryController {
  constructor(private readonly diariesService: DiaryService) {}

  @Post(':folderId')
  @ApiOperation({ summary: 'Cria um novo diário dentro de uma pasta' })
  @ApiParam({
    name: 'folderId',
    description: 'ID da pasta onde o diário será criado',
  })
  @UseGuards(AuthGuard)
  create(
    @Param('folderId') folderId: string,
    @Body() createDiaryDto: CreateDiaryDto,
  ) {
    return this.diariesService.createDiary(folderId, createDiaryDto);
  }

  @Get(':folderId')
  @ApiOperation({ summary: 'Lista todos os diários de uma pasta' })
  @ApiParam({ name: 'folderId', description: 'ID da pasta' })
  findAllByFolder(@Param('folderId') folderId: string) {
    return this.diariesService.findAll(folderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém um diário específico dentro de uma pasta' })
  @ApiParam({ name: 'folderId', description: 'ID da pasta' })
  @ApiParam({ name: 'id', description: 'ID do diário' })
  findOne(@Param('id') id: string) {
    return this.diariesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um diário dentro de uma pasta' })
  @ApiParam({ name: 'folderId', description: 'ID da pasta' })
  @ApiParam({ name: 'id', description: 'ID do diário' })
  update(@Param('id') id: string, @Body() updateDiaryDto: UpdateDiaryDto) {
    return this.diariesService.update(id, updateDiaryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um diário de uma pasta' })
  @ApiParam({ name: 'id', description: 'ID do diário' })
  remove(@Param('id') id: string) {
    return this.diariesService.remove(id);
  }
}
