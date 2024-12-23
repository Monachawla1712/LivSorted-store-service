import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PartnerContentsDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  prop: string;

  @IsOptional()
  @IsString()
  value: string;
}
