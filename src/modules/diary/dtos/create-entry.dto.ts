import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEntryDto {
  @ApiProperty({
    description: 'Texto da entrada',
    example: 'Hoje foi um ótimo dia!',
  })
  @IsNotEmpty({ message: 'O texto é obrigatório' })
  @IsString({ message: 'O texto deve ser uma string' })
  text: string;
}
