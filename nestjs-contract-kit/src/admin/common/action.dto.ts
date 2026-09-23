import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class NoteDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class RejectDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
