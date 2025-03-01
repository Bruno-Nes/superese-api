import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Folder } from '../entities/folder.entity';
import { Repository } from 'typeorm';
import { CreateFolderDto } from '../dtos/create-folder.dto';
import { UpdateFolderDto } from '../dtos/update-folder.dto';

@Injectable()
export class FolderService {
  constructor(
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
  ) {}

  async create(
    userId: string,
    createFolderDto: CreateFolderDto,
  ): Promise<Folder> {
    const folder = this.folderRepository.create({
      ...createFolderDto,
      user: { id: userId },
    });
    const result = await this.folderRepository.insert(folder);
    return result.raw;
  }

  async findAll(userId: string): Promise<Folder[]> {
    return this.folderRepository.find({
      where: { user: { id: userId } },
      relations: ['diaries'],
    });
  }

  async findOne(id: string, userId: string): Promise<Folder> {
    const folder = await this.folderRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['diaries'],
    });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
    return folder;
  }

  async update(
    id: string,
    userId: string,
    updateFolderDto: UpdateFolderDto,
  ): Promise<Folder> {
    const folder = await this.findOne(id, userId);
    Object.assign(folder, updateFolderDto);
    return this.folderRepository.save(folder);
  }

  async remove(id: string, userId: string): Promise<void> {
    const folder = await this.findOne(id, userId);
    await this.folderRepository.remove(folder);
  }
}
