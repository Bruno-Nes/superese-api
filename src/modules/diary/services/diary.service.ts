import { InjectRepository } from '@nestjs/typeorm';
import { Diary } from '../entities/diary.entity';
import { CreateDiaryDto } from '../dtos/create-diary.dto';
import { UpdateDiaryDto } from '../dtos/update-diary.dto';
import { Folder } from '../entities/folder.entity';
import { UserService } from '@modules/user/services/user.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateFolderDto } from '../dtos/create-folder.dto';
import { UpdateFolderDto } from '../dtos/update-folder.dto';
import { Profile } from '@modules/user/entities/profile.entity';

@Injectable()
export class DiaryService {
  constructor(
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,
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

    const amountOfFolders = await this.folderRepository.count({
      where: { profile: { id: profile.id } },
    });

    if (amountOfFolders > 25) {
      throw new Error(
        'The ammount of folders by this user cannot pass the limit off 25',
      );
    }

    const folder = this.folderRepository.create({
      ...createFolderDto,
      profile: { id: profile.id },
    });
    const result = await this.folderRepository.insert(folder);
    return result.raw;
  }

  async findAllFolders(firebaseUid: string): Promise<Folder[]> {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);
    return this.folderRepository.find({
      where: { profile: { id: profile.id } },
    });
  }

  async findOneFolder(id: string, firebaseUid: string): Promise<Folder> {
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

  async updateFolder(
    id: string,
    profileId: string,
    updateFolderDto: UpdateFolderDto,
  ): Promise<Folder> {
    const folder = await this.findOne(id, profileId);
    Object.assign(folder, updateFolderDto);
    return this.folderRepository.save(folder);
  }

  async removeFolder(id: string, firebaseUid: string): Promise<void> {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);
    const folder = await this.folderRepository.findOne({
      where: { id, profile: { id: profile.id } },
      relations: ['diaries'],
    });

    if (!folder) {
      throw new NotFoundException('Pasta não encontrada');
    }

    if (folder.profile.id !== profile.id) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar esta pasta',
      );
    }

    await this.diaryRepository.delete({ folder: { id } });
    await this.folderRepository.remove(folder);
  }

  async createDiary(
    folderId: string,
    createDiaryDto: CreateDiaryDto,
  ): Promise<Diary> {
    const diary = this.diaryRepository.create({
      ...createDiaryDto,
      folder: { id: folderId },
    });
    return (await this.diaryRepository.insert(diary)).raw;
  }

  async findAll(folderId: string): Promise<Diary[]> {
    return this.diaryRepository.find({ where: { folder: { id: folderId } } });
  }

  async findOne(id: string, folderId: string): Promise<Diary> {
    const diary = await this.diaryRepository.findOne({
      where: { id, folder: { id: folderId } },
    });
    if (!diary) {
      throw new NotFoundException('Diary not found');
    }
    return diary;
  }

  async update(
    id: string,
    folderId: string,
    updateDiaryDto: UpdateDiaryDto,
  ): Promise<Diary> {
    const diary = await this.findOne(id, folderId);
    Object.assign(diary, updateDiaryDto);
    return (await this.diaryRepository.insert(diary)).raw;
  }

  async remove(id: string): Promise<void> {
    const diary = await this.diaryRepository.findOne({
      where: { id },
    });
    await this.diaryRepository.remove(diary);
  }
}
