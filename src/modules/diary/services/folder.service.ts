import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Folder } from '../entities/folder.entity';
import { Repository } from 'typeorm';
import { CreateFolderDto } from '../dtos/create-folder.dto';
import { UpdateFolderDto } from '../dtos/update-folder.dto';
import { UserService } from '@modules/user/services/user.service';
import { Profile } from '@modules/user/entities/profile.entity';

@Injectable()
export class FolderService {
  constructor(
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    private readonly userService: UserService,
  ) {}

  async create(
    firebaseUid: string,
    createFolderDto: CreateFolderDto,
  ): Promise<Folder> {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);

    const folder = this.folderRepository.create({
      ...createFolderDto,
      profile: { id: profile.id },
    });
    const result = await this.folderRepository.insert(folder);
    return result.raw;
  }

  async findAll(firebaseUid: string): Promise<Folder[]> {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);
    return this.folderRepository.find({
      where: { profile: { id: profile.id } },
      relations: ['diaries'],
    });
  }

  async findOne(id: string, firebaseUid: string): Promise<Folder> {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);
    const folder = await this.folderRepository.findOne({
      where: { id, profile: { id: profile.id } },
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

  async remove(id: string, firebaseUid: string): Promise<void> {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);
    const folder = await this.folderRepository.findOne({
      where: { id, profile: { id: profile.id } },
    });
    await this.folderRepository.remove(folder);
  }
}
