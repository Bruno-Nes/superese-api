import {
  Controller,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  Get,
  Logger,
} from '@nestjs/common';
import { GPTConsultationService } from '../services/gpt-consultation.service';
import { GPTConsultationRequestDto } from '../dtos/gpt-consultation-request.dto';
import { GPTConsultationResponseDto } from '../dtos/gpt-consultation-response.dto';
import { RelatorioMotivacionalResponseDto } from '../dtos/relatorio-motivacional-response.dto';

@Controller('gpt-consultation')
export class GPTConsultationController {
  private readonly logger = new Logger(GPTConsultationController.name);

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
    const startTime = Date.now();

    this.logger.log('=== GPT Consultation Request Started ===');
    this.logger.log(`User: ${firebaseUid}`);
    this.logger.log(`Request data: ${JSON.stringify(requestDto)}`);
    this.logger.log(`Mood: ${requestDto.mood}`);
    this.logger.log(
      `Message length: ${requestDto.userMessage?.length || 0} characters`,
    );

    try {
      const result = await this.gptConsultationService.consultGPT(
        requestDto,
        firebaseUid,
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        '=== GPT Consultation Request Completed Successfully ===',
      );
      this.logger.log(`Duration: ${duration}ms`);
      this.logger.log(`Response conversation ID: ${result.conversationId}`);
      this.logger.log(
        `Plan created: ${result.planCreated ? 'Yes (ID: ' + result.planCreated.id + ')' : 'No'}`,
      );
      this.logger.log(
        `Response message length: ${result.gptResponse?.length || 0} characters`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('=== GPT Consultation Request Failed ===');
      this.logger.error(`Duration: ${duration}ms`);
      this.logger.error(`User: ${firebaseUid}`);
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);

      throw error;
    }
  }

  @Get('relatorio/:planId')
  @HttpCode(HttpStatus.OK)
  async gerarRelatorioMotivacional(
    @Param('planId') planId: string,
    @Request() request: any,
  ): Promise<RelatorioMotivacionalResponseDto> {
    const firebaseUid = request.user.uid;
    const startTime = Date.now();

    this.logger.log('=== Motivational Report Generation Started ===');
    this.logger.log(`User: ${firebaseUid}`);
    this.logger.log(`Plan ID: ${planId}`);

    try {
      const resultado =
        await this.gptConsultationService.gerarRelatorioMotivacional(
          planId,
          firebaseUid,
        );

      const duration = Date.now() - startTime;
      this.logger.log(
        '=== Motivational Report Generation Completed Successfully ===',
      );
      this.logger.log(`Duration: ${duration}ms`);
      this.logger.log(`Report ID: ${resultado.reportId}`);
      this.logger.log(
        `Report length: ${resultado.relatorio?.length || 0} characters`,
      );

      return { relatorio: resultado.relatorio };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('=== Motivational Report Generation Failed ===');
      this.logger.error(`Duration: ${duration}ms`);
      this.logger.error(`User: ${firebaseUid}`);
      this.logger.error(`Plan ID: ${planId}`);
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);

      throw error;
    }
  }
}
