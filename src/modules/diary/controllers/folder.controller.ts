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
} from '@nestjs/common';
import { FolderService } from '../services/folder.service';
import { CreateFolderDto } from '../dtos/create-folder.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { UpdateFolderDto } from '../dtos/update-folder.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Folders')
@ApiBearerAuth()
@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova pasta para o usuário autenticado' })
  create(@Request() req, @Body() createFolderDto: CreateFolderDto) {
    return this.folderService.create(req.user.id, createFolderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as pastas do usuário autenticado' })
  findAll(@Request() req) {
    return this.folderService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém detalhes de uma pasta específica' })
  @ApiParam({ name: 'id', description: 'ID da pasta' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.folderService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma pasta do usuário autenticado' })
  @ApiParam({ name: 'id', description: 'ID da pasta' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return this.folderService.update(id, req.user.id, updateFolderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma pasta do usuário autenticado' })
  @ApiParam({ name: 'id', description: 'ID da pasta' })
  remove(@Request() req, @Param('id') id: string) {
    return this.folderService.remove(id, req.user.id);
  }
}
