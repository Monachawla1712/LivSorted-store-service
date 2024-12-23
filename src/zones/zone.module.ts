import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ZoneEntity } from './entity/zone.entity';
import { ZoneService } from './zone.service';
import { ZoneController } from './zone.controller';
import { ZoneLogsEntity } from './entity/zone-logs.entity';
import { ZoneLogsService } from './zone-logs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ZoneEntity, ZoneLogsEntity]),
    ConfigModule,
  ],
  providers: [ZoneService, ZoneLogsService],
  controllers: [ZoneController],
})
export class ZoneModule {}
