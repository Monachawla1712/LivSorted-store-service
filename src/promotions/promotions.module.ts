import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PromotionsEntity } from './entity/promotions.entity';
import { PromotionService } from './promotions.service';
import { ProductsService } from '../products/products.service';
import { StoreService } from '../store/store.service';
import { PromotionsController } from './promotions.controller';
import { ProductEntity } from 'src/products/entity/products.entity';
import { Categories } from 'src/categories/entity/categories.entity';
import { ZoneService } from '../zones/zone.service';
import { StoreEntity } from 'src/store/entity/store.entity';
import { ZoneLogsEntity } from '../zones/entity/zone-logs.entity';
import { ZoneEntity } from '../zones/entity/zone.entity';
import { StoreParamsService } from '../store-params/store-params.service';
import { StoreParamsEntity } from '../store-params/store-params.entity';
import { OrderParamsEntity } from '../store-params/order-params.entity';
import { ProductSynonymsEntity } from '../search/entity/product-synonyms.entity';
import { ProductKeywordHitsEntity } from '../search/entity/product-keyword-hits.entity';
import { SearchService } from '../search/search.service';
import { InventoryViewRequestEntity } from '../store/entity/inventory-view-request.entity';
import { CategoriesService } from '../categories/categories.service';
import { ZoneLogsService } from '../zones/zone-logs.service';
import { ClusterEntity } from '../store/entity/clusters.entity';
import { RestApiService } from 'src/common/rest-api.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PromotionsEntity,
      ProductEntity,
      Categories,
      StoreEntity,
      ZoneLogsEntity,
      ZoneEntity,
      StoreParamsEntity,
      OrderParamsEntity,
      ProductSynonymsEntity,
      ProductKeywordHitsEntity,
      InventoryViewRequestEntity,
      ClusterEntity,
    ]),
  ],
  providers: [
    PromotionService,
    ProductsService,
    StoreService,
    ZoneService,
    StoreParamsService,
    SearchService,
    CategoriesService,
    ConfigService,
    ZoneLogsService,
    RestApiService,
  ],
  controllers: [PromotionsController],
})
export class PromotionsModule {}
