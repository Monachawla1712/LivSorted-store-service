import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductKeywordHitsEntity } from './entity/product-keyword-hits.entity';
import { ProductSynonymsEntity } from './entity/product-synonyms.entity';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { StoreParamsEntity } from '../store-params/store-params.entity';
import { StoreParamsService } from '../store-params/store-params.service';
import { OrderParamsEntity } from '../store-params/order-params.entity';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductKeywordHitsEntity,
      ProductSynonymsEntity,
      StoreParamsEntity,
      OrderParamsEntity,
    ]),
  ],
  providers: [SearchService, StoreParamsService, ConfigService],
  controllers: [SearchController],
})
export class SearchModule {}
