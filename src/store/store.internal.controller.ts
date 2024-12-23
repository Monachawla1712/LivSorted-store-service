import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { CordinatesDto, StoresSearchDto } from './dto/selectStores.dto';
import { StoreEntity } from './entity/store.entity';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { SkuBean, StoreSkuResponseDto } from './dto/storeSkuResponse.dto';

@Controller('internal')
@ApiTags('Stores Internal')
@UseFilters(HttpExceptionFilter)
export class StoreInternalController {
  private readonly logger = new CustomLogger(StoreInternalController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private storeService: StoreService,
  ) {}

  @Get('store')
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'store uuid',
  })
  @ApiQuery({
    name: 'store_id',
    required: false,
    description: 'store number',
  })
  @ApiQuery({
    name: 'lithos_ref',
    required: false,
    description: 'lithos store number',
  })
  getStore(@Query() filters, @Headers('userId') userId: string) {
    return this.storeService.getStores(filters, userId);
  }

  @ApiBody({ type: CordinatesDto })
  @Post('store/near')
  nearestStore(
    @Body() cordinates: CordinatesDto,
    @Headers('userId') userId: string,
  ) {
    return this.storeService.getNearestStore(
      cordinates.lat,
      cordinates.long,
      userId,
    );
  }

  @ApiBody({ type: CordinatesDto })
  @Get('store/:store_id')
  getStoreByIdInternal(
    @Param('store_id') storeId,
    @Headers('userId') userId: string,
  ) {
    return this.storeService.getStoreFromStoreId(storeId);
  }

  @Get('fos/store/:owner_id/unverified-stores')
  async getFranchiseStoresFromOwnerId(
    @Param('owner_id') ownerId: string,
  ): Promise<StoreEntity[]> {
    return await this.storeService.getFranchiseStoresFromOwnerId(ownerId);
  }

  @Get('franchise-store/catalog/offers')
  async getMasterSkusWithOffer(
    @Query('storeId') storeId: string,
  ): Promise<any> {
    const storeInfo = await this.storeService.getStoreByStoreId(storeId);
    if (!storeInfo) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'No store found with id' + storeId,
      );
      throw new HttpException(
        {
          message: 'No store found with id' + storeId,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    let response: string[] = [];
    let storeSkuResponseDto = new StoreSkuResponseDto();
    try {
      storeSkuResponseDto = (await this.storeService.getSkus(
        storeId,
      )) as StoreSkuResponseDto;
      const skuCodes: string[] = storeSkuResponseDto.skuBeans
        .filter(
          (skuBean: SkuBean) =>
            (skuBean.priceBrackets != null &&
              skuBean.priceBrackets.length > 0) ||
            skuBean.salePrice < skuBean.markedPrice,
        )
        .map((skuBean: SkuBean) => skuBean.skuCode);
      response = skuCodes;
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching skus',
        e,
      );
    }
    return response;
  }
  @Post('stores')
  getStores(
    @Body() request: StoresSearchDto,
    @Headers('userId') userId: string,
  ): Promise<StoreEntity[]> {
    const filters: any = { isActive: true };
    if (request.storeIds != null) {
      filters.store_id = request.storeIds.join(',');
    }
    if (request.city != null) {
      filters.city = request.city;
    }
    return this.storeService.getStores(filters, userId);
  }
}
