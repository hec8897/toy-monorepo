import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEntryDto {
  @IsString()
  @MinLength(10)
  content: string;

  @IsString()
  @IsOptional()
  title?: string;
}
