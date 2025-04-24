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
  create(
    @Request() req,
    @Body() createFolderDto: CreateFolderDto,
    @Req() request: any,
  ) {
    const firebaseUserId = request.user.uid;
    return this.folderService.create(firebaseUserId, createFolderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as pastas do usuário autenticado' })
  findAll(@Request() req) {
    const firebaseUserId = req.user.uid;
    return this.folderService.findAll(firebaseUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém detalhes de uma pasta específica' })
  @ApiParam({ name: 'id', description: 'ID da pasta' })
  findOne(@Request() req, @Param('id') id: string) {
    const firebaseUserId = req.user.uid;
    return this.folderService.findOne(id, firebaseUserId);
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
    const firebaseUserId = req.user.uid;
    return this.folderService.remove(id, firebaseUserId);
  }
}
