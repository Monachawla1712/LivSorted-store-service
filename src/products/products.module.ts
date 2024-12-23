import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entity/products.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsInternalController } from './products.internal.controller';
import { Categories } from 'src/categories/entity/categories.entity';
import { SearchService } from '../search/search.service';
import { ProductSynonymsEntity } from '../search/entity/product-synonyms.entity';
import { ProductKeywordHitsEntity } from '../search/entity/product-keyword-hits.entity';
import { CategoriesService } from '../categories/categories.service';
import { CommonService } from '../common/common.service';
import { ConfigService } from '@nestjs/config';
import { StoreParamsService } from '../store-params/store-params.service';
import { StoreParamsEntity } from '../store-params/store-params.entity';
import { OrderParamsEntity } from '../store-params/order-params.entity';
import { BulkUploadEntity } from '../common/entity/bulk-upload.entity';
import { SocietySkuDiscountEntity } from '../society/entity/society.sku.discount.entity';
import { RestApiService } from 'src/common/rest-api.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      Categories,
      ProductSynonymsEntity,
      ProductKeywordHitsEntity,
      StoreParamsEntity,
      OrderParamsEntity,
      BulkUploadEntity,
      SocietySkuDiscountEntity,
    ]),
  ],
  providers: [
    ProductsService,
    SearchService,
    CategoriesService,
    CommonService,
    ConfigService,
    StoreParamsService,
    RestApiService,
  ],
  controllers: [ProductsController, ProductsInternalController],
})
export class ProductsModule {}
