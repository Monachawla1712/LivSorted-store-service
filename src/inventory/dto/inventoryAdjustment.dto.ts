import { IsNumber, IsOptional, IsString } from 'class-validator';

export class InventoryAdjustmentDto {
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  remarks: string;
}
