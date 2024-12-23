import {
  Controller,
  UseFilters,
  Get,
  Query,
  Body,
  Param,
  HttpException,
  HttpStatus, Post,
} from '@nestjs/common';
import {
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpExceptionFilter } from 'src/common/http-exception.filter';
import { ProductEntity } from './entity/products.entity';
import { ProductsService } from './products.service';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { DataSource } from 'typeorm';
import { ProductPerPcWtRequest } from './dto/productPerPcWtRequest.dto';

@Controller('internal/products')
@ApiTags('Products Internal')
@UseFilters(HttpExceptionFilter)
export class ProductsInternalController {
  private readonly logger = new CustomLogger(ProductsInternalController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private productsService: ProductsService,
  ) { }

  @ApiResponse({ type: [ProductEntity] })
  @Get()
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'product uuid',
  })
  @ApiQuery({
    name: 'sku_code',
    required: false,
    description: 'Product sku_code',
  })
  @ApiQuery({
    name: 'lithos_ref',
    required: false,
    description: 'lithos store number',
  })
  getAllProducts(@Query() filters): Promise<ProductEntity[]> {
    return this.productsService.getAllProduct(filters);
  }

  @Post('/:sku')
  async updateProductVideos(
    @Body('url') url: string,
    @Param('sku') sku: string,
  ) {
    const products: ProductEntity[] = await this.productsService.getAllProduct({
      sku_code: sku,
    });
    if (products.length == 0) {
      throw new HttpException(
        {
          message: 'No product exists with given sku code: ' + sku,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (products[0].videos) {
      products[0].videos.splice(0, products[0].videos.length);
    }
    products[0].videos = [url];
    return this.productsService.updateProductVideo(products[0]);
  }

  @Post('/:sku/per-pc-wt')
  async updateProductPerPcWt(
    @Body() reqBody: ProductPerPcWtRequest,
    @Param('sku') sku: string,
  ) {
    const products: ProductEntity[] = await this.productsService.getAllProduct({
      sku_code: sku
    });
    if (products.length == 0) {
      throw new HttpException(
        {
          message: 'No product exists with given sku code: ' + sku,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.productsService.updateProductPerPcWt(products[0], reqBody);
  }
}
