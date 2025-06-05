import {
  Controller,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GPTConsultationService } from '../services/gpt-consultation.service';
import { GPTConsultationRequestDto } from '../dtos/gpt-consultation-request.dto';
import { GPTConsultationResponseDto } from '../dtos/gpt-consultation-response.dto';

@Controller('gpt-consultation')
export class GPTConsultationController {
  constructor(
    private readonly gptConsultationService: GPTConsultationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async consultGPT(
    @Body() requestDto: GPTConsultationRequestDto,
    @Request() request: any,
  ): Promise<GPTConsultationResponseDto> {
    const firebaseUid = request.user.uid;
    return this.gptConsultationService.consultGPT(requestDto, firebaseUid);
  }
}
