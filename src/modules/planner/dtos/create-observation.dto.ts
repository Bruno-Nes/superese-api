import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateObservationDTO {
  @IsNotEmpty()
  @IsString()
  text: string;

  @IsEnum(['progress', 'regress'])
  type: 'progress' | 'regress';
}
