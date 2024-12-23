import { Controller, Post, Get, UseFilters, Query, Body } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { SearchService } from './search.service';
import { NewProductKeywordHitDto } from './dto/product-keyword-hit.dto';
import { StoreParamsService } from '../store-params/store-params.service';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { CustomLogger } from '../common/custom-logger';

@Controller('search')
@ApiTags('Search')
@UseFilters(HttpExceptionFilter)
export class SearchController {
  private readonly logger = new CustomLogger(SearchController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private storeParamsService: StoreParamsService,
    private searchService: SearchService,
  ) {}

  @Get('product')
  async getProductSearch(@Query('keyword') keyword: string): Promise<string[]> {
    let response: string[] = [];
    let token_set_ratio_threshold = 70;
    let partial_ratio_threshold = 70;
    const threshold = await this.storeParamsService.getJsonParamValue(
      'PRODUCT_SEARCH_THRESHOLD',
      {
        token_set_ratio_threshold: token_set_ratio_threshold,
        partial_ratio_threshold: partial_ratio_threshold,
      },
    );
    token_set_ratio_threshold =
      threshold['token_set_ratio_threshold'] != undefined &&
      threshold['token_set_ratio_threshold'] != null
        ? Number(threshold['token_set_ratio_threshold'])
        : token_set_ratio_threshold;

    partial_ratio_threshold =
      threshold['partial_ratio_threshold'] != undefined &&
      threshold['partial_ratio_threshold'] != null
        ? Number(threshold['partial_ratio_threshold'])
        : partial_ratio_threshold;
    try {
      const products = await this.searchService.getProductSearch(
        keyword.trim(),
        token_set_ratio_threshold,
        partial_ratio_threshold,
      );
      const productSuggestions = new Set<string>();
      if (products.length > 0) {
        products.forEach((x) => productSuggestions.add(x.productCode));
        response = Array.from(productSuggestions);
      }
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching product using search',
        e,
      );
    }
    return response;
  }

  @Post('keyword-hit')
  @ApiBody({ type: NewProductKeywordHitDto })
  createOrUpdateKeywordHit(
    @Body() productKeywordHitDto: NewProductKeywordHitDto,
  ) {
    return this.searchService.createOrUpdateKeywordHit(productKeywordHitDto);
  }
}
