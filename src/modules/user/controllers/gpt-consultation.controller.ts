import {
  Controller,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  Get,
} from '@nestjs/common';
import { GPTConsultationService } from '../services/gpt-consultation.service';
import { GPTConsultationRequestDto } from '../dtos/gpt-consultation-request.dto';
import { GPTConsultationResponseDto } from '../dtos/gpt-consultation-response.dto';
import { RelatorioMotivacionalResponseDto } from '../dtos/relatorio-motivacional-response.dto';

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

  @Get('relatorio/:planId')
  @HttpCode(HttpStatus.OK)
  async gerarRelatorioMotivacional(
    @Param('planId') planId: string,
    @Request() request: any,
  ): Promise<RelatorioMotivacionalResponseDto> {
    const firebaseUid = request.user.uid;
    const resultado =
      await this.gptConsultationService.gerarRelatorioMotivacional(
        planId,
        firebaseUid,
      );
    return { relatorio: resultado.relatorio };
  }
}
