import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SecondaryUomDetailsDto {
  @IsNotEmpty()
  @IsString()
  uom: string;

  @IsOptional()
  @IsNumber()
  min: number;

  @IsOptional()
  @IsNumber()
  max: number;

  @IsOptional()
  @IsNumber()
  step: number;
}
