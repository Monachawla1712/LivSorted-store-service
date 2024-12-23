import {
  Body,
  Controller,
  UseFilters,
  Param,
  Get,
  Put,
  Query,
  Post,
  Headers,
} from '@nestjs/common';
import {
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { HttpExceptionFilter } from 'src/common/http-exception.filter';
import {
  InternalUpdateResponse,
  InternalUpdateVerifyAndDeductResponse,
  InternalGetInventoryResponse,
} from './dto/internal.responses.dto';
import { UpdateInventoryQuantityDto } from './dto/updateInventoryQuantity.dto';
import { VerifyAndDeductInventory } from './dto/verifyAndDeductInventory.dto';
import { InventoryService } from './inventory.service';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@ApiBearerAuth()
@Controller('internal/inventory')
@ApiTags('Inventory - Internal Apis')
@UseFilters(HttpExceptionFilter)
export class InternalInventoryController {
  private readonly logger = new CustomLogger(InternalInventoryController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private inventoryService: InventoryService,
  ) {}

  @ApiBody({ type: [UpdateInventoryQuantityDto] })
  @ApiResponse({ status: 200, type: InternalUpdateResponse })
  @ApiOperation({
    summary: `Replace existing inventory for a store.
      Store_id to be passed is store number.
      To be used for warehouse`,
  })
  @ApiParam({ name: 'store_id', required: true })
  @Put('store/:store_id')
  updateInventoryQuantity(
    @Headers('userId') updatedBy: string,
    @Body() reqBody,
    @Param('store_id') store_id,
  ) {
    return this.inventoryService.updateInventoryQuantity(
      reqBody.data,
      store_id,
      updatedBy,
    );
  }

  @ApiBody({ type: UpdateInventoryQuantityDto })
  @ApiResponse({ status: 200, type: InternalUpdateResponse })
  @ApiOperation({
    summary: `Add or deduct from existing inventory for a store.
      Store_id to be passed is store number.
      To be used for warehouse`,
  })
  @ApiParam({ name: 'store_id', required: true })
  @Post('store/:store_id')
  updateInventoryQuantityByAdmin(
    @Body() reqBody,
    @Param('store_id') store_id,
    @Headers('userId') updatedBy: string,
  ) {
    return this.inventoryService.updateInventoryQuantityByAdminForRelatedStores(
      reqBody.data,
      store_id,
      updatedBy,
    );
  }

  @ApiResponse({ status: 200, type: InternalGetInventoryResponse })
  @Get('store/:storeId')
  @ApiParam({ name: 'storeId', required: true })
  @ApiQuery({
    name: 'sku',
    required: false,
    description: 'coma seperated sku codes',
    example: 'sku_1,sku_2',
  })
  async getInventory(
    @Param('storeId') storeId,
    @Query('sku') skus,
    @Query('userId') userId,
    @Query('appVersion') appVersion,
  ) {
    return this.inventoryService.getInventory(
      storeId,
      skus && skus.length ? skus.split(',') : [],
      true,
      userId,
      appVersion,
    );
  }

  @ApiBody({ type: VerifyAndDeductInventory })
  @ApiResponse({ status: 200, type: InternalUpdateVerifyAndDeductResponse })
  @ApiParam({ name: 'storeId', required: true })
  @Post('store/:storeId/verifyAndDeduct')
  verifyAndDeduct(@Body() reqBody: VerifyAndDeductInventory, @Param() param) {
    return this.inventoryService.verifyAndDeduct(
      reqBody.data,
      reqBody.user_id,
      param.storeId,
    );
  }
}
