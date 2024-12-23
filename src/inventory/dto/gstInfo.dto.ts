import { IsNumber, IsOptional } from 'class-validator';

export class GstInfoDto {
  @IsOptional()
  @IsNumber()
  sgst: number;
  @IsOptional()
  @IsNumber()
  cgst: number;
  @IsOptional()
  @IsNumber()
  igst: number;
  @IsOptional()
  @IsNumber()
  cess: number;

  constructor() {
    this.sgst = 0;
    this.cgst = 0;
    this.igst = 0;
    this.cess = 0;
  }
}
