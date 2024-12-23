import {
  Body,
  Controller,
  Post,
  UseFilters,
  Patch,
  Param,
  Get,
  Headers,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  HttpException,
  HttpStatus,
  UploadedFiles, Put,
} from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from 'src/common/http-exception.filter';
import { XLXSReqBodyDto } from 'src/common/dto/xlsxReqBody.dto';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { ProductEntity } from './entity/products.entity';
import { ProductsService } from './products.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Readable } from 'stream';
import { parse } from 'papaparse';
import { UpdateTagsResponseDto } from './dto/UpdateTagsResponse.dto';
import { ProductDetailsDto } from './dto/productDetails.dto';
import type { Response } from 'express';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { CommonService } from '../common/common.service';
import { v4 as uuidv4 } from 'uuid';
import { SkuPerPcsWtDto } from "./dto/sku-per-pcs-wt.dto";

@Controller('products')
@ApiTags('Products')
@UseFilters(HttpExceptionFilter)
export class ProductsController {
  private readonly logger = new CustomLogger(ProductsController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private productsService: ProductsService,
    private commonService: CommonService,
  ) { }
  
  @Put('per-pcs-wt')
  async updatePerPcsWeight(
      @Headers('userId') userId: string,
      @Body() skuPcsWtDto: SkuPerPcsWtDto[]
  ) {
    this.productsService.updatePerPcsWeight(skuPcsWtDto, userId);
  }

  @ApiBody({ type: CreateProductDto })
  @Post()
  @ApiResponse({ type: ProductDetailsDto })
  createProduct(
    @Body() reqBody: CreateProductDto,
    @Headers('userId') createdBy: string,
  ): Promise<ProductDetailsDto> {
    return this.productsService.createProduct(reqBody, createdBy);
  }

  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ type: ProductDetailsDto })
  @ApiParam({ name: 'productId', required: true })
  @Patch('/:productId')
  updateProduct(
    @Body() reqBody: UpdateProductDto,
    @Param() param,
    @Headers('userId') createdBy: string,
  ): Promise<ProductDetailsDto> {
    if (isNaN(param.productId)) {
      throw new HttpException(
        { message: 'product id not provided.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const productId = parseInt(param.productId);
    return this.productsService.updateProduct(reqBody, productId, createdBy);
  }

  @ApiResponse({ type: [ProductEntity] })
  @Get()
  getAllProducts(): Promise<ProductDetailsDto[]> {
    return this.productsService.getAllProductDetails();
  }

  @Post('/xlsx')
  @ApiBody({ type: XLXSReqBodyDto })
  createDataXLSXProduct(
    @Body() reqBody: XLXSReqBodyDto,
    @Headers('userId') createdBy: string,
  ) {
    return this.productsService.createDataXLSXProduct(
      reqBody.fileName,
      createdBy,
    );
  }

  @Post('/upload/tags')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTags(@UploadedFile() file, @Res() res: Response) {
    return this.importData(file.buffer.toString('base64'), res);
  }

  async importData(fileBufferInBase64: string, res: Response) {
    const buffer = Buffer.from(fileBufferInBase64, 'base64');
    const dataStream = Readable.from(buffer);
    const results = await this.readCSVData(dataStream);
    const products: ProductEntity[] =
      await this.productsService.getAllProduct();
    const validSkus = new Set(products.map((product) => product.sku_code));
    const error = new Set();
    this.logger.log(
      this.asyncContext.get('traceId'),
      'fields : ' + results.meta.fields,
    );
    if (
      !(results.meta.fields[0] == 'skuCode') ||
      !(results.meta.fields[1] == 'collectionTags') ||
      !(results.meta.fields[2] == 'classTags')
    ) {
      error.add({
        skuCode: 'file format',
        msg: 'File must have skuCode, collectionTags and classTags column headers',
      });
      results.errors = [...error];
      res.statusCode = 400;
      return res.send(results);
    }
    for (let a = 0; a < results.data.length; a++) {
      if (!validSkus.has(results.data[a].skuCode.trim())) {
        error.add({
          skuCode: results.data[a].skuCode,
          msg: 'SkuCode not found for row ' + a.toString(),
        });
      } else if (
        !results.data[a].collectionTags.trim() &&
        !results.data[a].classTags.trim()
      ) {
        error.add({
          skuCode: results.data[a].skuCode,
          msg:
            'Either collectionTags or classTags must be given for row ' +
            a.toString(),
        });
      }
    }
    if (error.size > 0) {
      results.errors = [...error];
      res.statusCode = 400;
      return res.send(results);
    }
    await this.productsService.bulkUpdateProductTags(products, results.data);
    this.logger.log(this.asyncContext.get('traceId'), 'data : ' + results.data);
    res.statusCode = 201;
    return res.send(results);
  }

  async readCSVData(dataStream): Promise<UpdateTagsResponseDto> {
    return new Promise((resolve, reject) => {
      const parsedCsv = parse(dataStream, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

  @ApiBody({ type: String })
  @ApiParam({ name: 'query', required: true })
  @Get('/filter/sku-code')
  async filterBySkuCodes(@Query() query) {
    const products = await this.productsService.getProductsInfo(query);
    return { skus: products.map((product) => product.sku_code) };
  }

  @ApiBody({ type: String })
  @ApiParam({ name: 'query', required: true })
  @Get('/filter/tags')
  async filterByTags(@Query() query) {
    const products = await this.productsService.filterByTags(query);
    return { skus: [...products] };
  }

  @ApiBody({ type: String })
  @ApiParam({ name: 'query', required: true })
  @Get('/filter/categories')
  async filterByCategories(@Query() query) {
    const products = await this.productsService.filterByCategories(query);
    return { skus: products.map((product) => product.sku_code) };
  }

  // todo: not in use
  @ApiResponse({ type: ProductDetailsDto })
  @Get('/:productId')
  getProductById(
    @Param('productId') productId: number,
  ): Promise<ProductDetailsDto> {
    return this.productsService.getProductById(productId);
  }

  @Post('/download/tags')
  async getFile(@Res() res: Response) {
    const csv = await this.productsService.getCSVData();
    res.header('Content-Type', 'text/csv');
    res.attachment(
      'metadataTags' + Math.floor(new Date().getTime() / 1000) + '.csv',
    );
    return res.send(csv);
  }

  @Post('upload/videos')
  @UseInterceptors(FilesInterceptor('files', 20))
  async uploadMedia(@UploadedFiles() files: Array<Express.Multer.File>) {
    const fileUrls = [];
    for (const file of files) {
      const fileUrl = await this.commonService.uploadFile(
        file,
        'product',
        `product-video-` + uuidv4() + '-' + file.originalname,
      );
      fileUrls.push(fileUrl);
    }
    return { mediaUrls: fileUrls };
  }
}
