import { IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryEntity } from '../entity/inventory.entity';

class Errors {
  @ApiProperty({ example: 'sku-001', description: 'Array of errored skus' })
  sku_code: string;

  @ApiProperty({
    example: 'INVENTORY_NOT_FOUND_IN_STORE',
    description: 'Type of error - INVENTORY_NOT_FOUND_IN_STORE',
  })
  code: string;
}

class ErrorsVerifyAndDeduct {
  @ApiProperty({ example: 'sku-001', description: 'Array of errored skus' })
  sku_code: string;

  @ApiProperty({
    example: 'INVENTORY_NOT_FOUND_IN_STORE',
    description:
      'Type of error - INVENTORY_NOT_FOUND_IN_STORE || BELOW_BUFFER_QUANTITY',
  })
  code: string;

  @ApiPropertyOptional({
    example: '11.34',
    description: 'Max available quantity',
  })
  max_quantity?: number;
}

export class InternalUpdateResponse {
  @IsBoolean()
  @ApiProperty({ example: true, description: 'API status' })
  success: boolean;

  @IsObject()
  @ApiProperty({ type: [Errors], description: 'Array of errored skus' })
  errors: [Errors];
}

export class InternalUpdateVerifyAndDeductResponse {
  @IsBoolean()
  @ApiProperty({ example: true, description: 'API status' })
  success: boolean;

  @IsObject()
  @ApiProperty({
    type: [ErrorsVerifyAndDeduct],
    description: 'Array of errored skus',
  })
  errors: [ErrorsVerifyAndDeduct];
}

export class InternalGetInventoryResponse {
  @IsObject()
  @ApiProperty({
    type: [InventoryEntity],
    description: 'Array of inventory items',
  })
  inventory: [InventoryEntity];
}
