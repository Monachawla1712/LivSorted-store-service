import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { StoreEntity } from './entity/store.entity';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { StoreInternalController } from './store.internal.controller';
import { ZoneEntity } from '../zones/entity/zone.entity';
import { ZoneService } from '../zones/zone.service';
import { ZoneLogsEntity } from '../zones/entity/zone-logs.entity';
import { StoreParamsService } from '../store-params/store-params.service';
import { StoreParamsEntity } from '../store-params/store-params.entity';
import { OrderParamsEntity } from '../store-params/order-params.entity';
import { InventoryViewRequestEntity } from './entity/inventory-view-request.entity';
import { CommonService } from '../common/common.service';
import { InventoryViewRequestService } from './inventory-view-request.service';
import { ZoneLogsService } from '../zones/zone-logs.service';
import { ProductsService } from '../products/products.service';
import { Categories } from '../categories/entity/categories.entity';
import { ProductEntity } from '../products/entity/products.entity';
import { SearchService } from '../search/search.service';
import { ProductKeywordHitsEntity } from '../search/entity/product-keyword-hits.entity';
import { ProductSynonymsEntity } from '../search/entity/product-synonyms.entity';
import { CategoriesService } from '../categories/categories.service';
import { ClusterEntity } from './entity/clusters.entity';
import { BulkUploadEntity } from '../common/entity/bulk-upload.entity';
import { SocietySkuDiscountEntity } from '../society/entity/society.sku.discount.entity';
import { RestApiService } from 'src/common/rest-api.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoreEntity,
      ZoneEntity,
      ZoneLogsEntity,
      StoreParamsEntity,
      OrderParamsEntity,
      InventoryViewRequestEntity,
      ProductEntity,
      Categories,
      ProductKeywordHitsEntity,
      ProductSynonymsEntity,
      ClusterEntity,
      BulkUploadEntity,
      SocietySkuDiscountEntity,
    ]),
  ],
  providers: [
    StoreService,
    ZoneService,
    StoreParamsService,
    CommonService,
    ConfigService,
    InventoryViewRequestService,
    ZoneLogsService,
    ProductsService,
    CategoriesService,
    SearchService,
    RestApiService,
  ],
  controllers: [StoreController, StoreInternalController],
})
export class StoreModule {}
