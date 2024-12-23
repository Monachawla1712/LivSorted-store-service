import { Module, forwardRef } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';
import { StoreParamsService } from 'src/store-params/store-params.service';
import { StoreParamsModule } from 'src/store-params/store-params.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [CacheService],
  controllers: [CacheController]
})
export class CacheModule { }
