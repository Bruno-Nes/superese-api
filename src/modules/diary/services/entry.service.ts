import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entry } from '../entities/entry.entity';
import { CreateEntryDto } from '../dtos/create-entry.dto';
import { Diary } from '../entities/diary.entity';
import { UpdateEntryDto } from '../dtos/update-entry.dto';

@Injectable()
export class EntryService {
  constructor(
    @InjectRepository(Entry)
    private readonly entryRepository: Repository<Entry>,
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,
  ) {}

  async create(
    diaryId: string,
    createEntryDto: CreateEntryDto,
  ): Promise<Entry> {
    const diary = await this.diaryRepository.findOne({
      where: { id: diaryId },
    });
    if (!diary) {
      throw new NotFoundException('Diary not found');
    }
    const entry = this.entryRepository.create({
      ...createEntryDto,
      diary: { id: diaryId },
    });
    return (await this.entryRepository.insert(entry)).raw;
  }

  async findAll(diaryId: string): Promise<Entry[]> {
    return this.entryRepository.find({ where: { diary: { id: diaryId } } });
  }

  async findOne(id: string, diaryId: string): Promise<Entry> {
    const entry = await this.entryRepository.findOne({
      where: { id, diary: { id: diaryId } },
    });
    if (!entry) {
      throw new NotFoundException('Entry not found');
    }
    return entry;
  }

  async update(
    id: string,
    diaryId: string,
    updateEntryDto: UpdateEntryDto,
  ): Promise<Entry> {
    const diary = await this.diaryRepository.findOne({
      where: { id: diaryId },
    });
    if (!diary) {
      throw new NotFoundException('Diary not found');
    }
    const entry = await this.findOne(id, diaryId);
    Object.assign(entry, updateEntryDto);
    return this.entryRepository.save(entry);
  }

  async remove(id: string, diaryId: string): Promise<void> {
    const entry = await this.findOne(id, diaryId);
    await this.entryRepository.remove(entry);
  }
}
