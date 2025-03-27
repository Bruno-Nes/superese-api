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
    profileId: string,
    createFolderDto: CreateFolderDto,
  ): Promise<Folder> {
    const folder = this.folderRepository.create({
      ...createFolderDto,
      profile: { id: profileId },
    });
    const result = await this.folderRepository.insert(folder);
    return result.raw;
  }

  async findAll(profileId: string): Promise<Folder[]> {
    return this.folderRepository.find({
      where: { profile: { id: profileId } },
      relations: ['diaries'],
    });
  }

  async findOne(id: string, profileId: string): Promise<Folder> {
    const folder = await this.folderRepository.findOne({
      where: { id, profile: { id: profileId } },
      relations: ['diaries'],
    });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
    return folder;
  }

  async update(
    id: string,
    profileId: string,
    updateFolderDto: UpdateFolderDto,
  ): Promise<Folder> {
    const folder = await this.findOne(id, profileId);
    Object.assign(folder, updateFolderDto);
    return this.folderRepository.save(folder);
  }

  async remove(id: string, profileId: string): Promise<void> {
    const folder = await this.findOne(id, profileId);
    await this.folderRepository.remove(folder);
  }
}
