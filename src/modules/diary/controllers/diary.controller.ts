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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Diaries')
@ApiBearerAuth()
@Controller('folders/diaries')
@UseGuards(JwtAuthGuard)
export class DiaryController {
  constructor(private readonly diariesService: DiaryService) {}

  @Post(':folderId')
  @ApiOperation({ summary: 'Cria um novo diário dentro de uma pasta' })
  @ApiParam({
    name: 'folderId',
    description: 'ID da pasta onde o diário será criado',
  })
  create(
    @Param('folderId') folderId: string,
    @Body() createDiaryDto: CreateDiaryDto,
  ) {
    return this.diariesService.create(folderId, createDiaryDto);
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
  findOne(@Param('folderId') folderId: string, @Param('id') id: string) {
    return this.diariesService.findOne(id, folderId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um diário dentro de uma pasta' })
  @ApiParam({ name: 'folderId', description: 'ID da pasta' })
  @ApiParam({ name: 'id', description: 'ID do diário' })
  update(
    @Param('folderId') folderId: string,
    @Param('id') id: string,
    @Body() updateDiaryDto: UpdateDiaryDto,
  ) {
    return this.diariesService.update(id, folderId, updateDiaryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um diário de uma pasta' })
  @ApiParam({ name: 'id', description: 'ID do diário' })
  remove(@Param('id') id: string) {
    return this.diariesService.remove(id);
  }
}
