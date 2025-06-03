import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { CreateFolderDto } from '../dtos/create-folder.dto';
import { UpdateFolderDto } from '../dtos/update-folder.dto';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@modules/auth/guards/auth.guard';
import { DiaryService } from '../services/diary.service';

@ApiTags('Folders')
@Controller('folders')
export class FolderController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova pasta para o usuário autenticado' })
  @UseGuards(AuthGuard)
  create(@Body() createFolderDto: CreateFolderDto, @Req() request: any) {
    const firebaseUserId = request.user.uid;
    return this.diaryService.create(firebaseUserId, createFolderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as pastas do usuário autenticado' })
  findAll(@Request() req) {
    const firebaseUserId = req.user.uid;
    return this.diaryService.findAllFolders(firebaseUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém detalhes de uma pasta específica' })
  @ApiParam({ name: 'id', description: 'ID da pasta' })
  findOne(@Request() req, @Param('id') id: string) {
    const firebaseUserId = req.user.uid;
    return this.diaryService.findOneFolder(id, firebaseUserId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma pasta do usuário autenticado' })
  @ApiParam({ name: 'id', description: 'ID da pasta' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return this.diaryService.updateFolder(id, req.user.id, updateFolderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma pasta do usuário autenticado' })
  @ApiParam({ name: 'id', description: 'ID da pasta' })
  remove(@Request() req, @Param('id') id: string) {
    const firebaseUserId = req.user.uid;
    return this.diaryService.removeFolder(id, firebaseUserId);
  }
}
