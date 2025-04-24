import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Diary } from '../entities/diary.entity';
import { CreateDiaryDto } from '../dtos/create-diary.dto';
import { UpdateDiaryDto } from '../dtos/update-diary.dto';

@Injectable()
export class DiaryService {
  constructor(
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,
  ) {}

  async create(
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
    return this.diaryRepository.find({ where: { id: folderId } });
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
