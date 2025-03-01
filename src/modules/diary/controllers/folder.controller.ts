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

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  create(@Request() req, @Body() createFolderDto: CreateFolderDto) {
    return this.folderService.create(req.user.id, createFolderDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.folderService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.folderService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return this.folderService.update(id, req.user.id, updateFolderDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.folderService.remove(id, req.user.id);
  }
}
