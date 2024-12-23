import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Headers,
  Param,
  UseFilters,
} from '@nestjs/common';
import { PromotionService } from './promotions.service';
import { StoreService } from '../store/store.service';
import { Level } from './enum/promotion.level.enum';
import { ProductsService } from '../products/products.service';
import { UpdatePromotionDto, NewPromotionDto } from './dto/promotion.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Controller('promotions')
@ApiTags('Promotions')
@UseFilters(HttpExceptionFilter)
export class PromotionsController {
  private readonly logger = new CustomLogger(PromotionsController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private promotionService: PromotionService,
    private productsService: ProductsService,
    private storeService: StoreService,
  ) {}

  @Get()
  getPromotions() {
    return this.promotionService.getPromotions();
  }

  @ApiBody({ type: NewPromotionDto })
  @Post()
  createPromotion(
    @Body() promotion: NewPromotionDto,
    @Headers('userId') createdBy: string,
  ) {
    return this.promotionService.createPromotion(promotion, createdBy);
  }

  @Get('option')
  async getOptions() {
    const promotion_level = Object.keys(Level);
    const { stores, cities, states } =
      await this.storeService.getDistinctKeys();
    const skus = await this.productsService.getAllSkus();
    return { promotion_level, stores, cities, states, skus };
  }

  @ApiBody({ type: UpdatePromotionDto })
  @Patch(':promotionId')
  updateStore(
    @Body() promotion: UpdatePromotionDto,
    @Headers('userId') updatedBy,
    @Param('promotionId') id: number,
  ) {
    return this.promotionService.updatePromotion(id, promotion, updatedBy);
  }
}
