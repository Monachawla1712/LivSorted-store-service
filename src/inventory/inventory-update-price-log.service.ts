import { AsyncContext } from '@nestjs-steroids/async-context';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomLogger } from '../common/custom-logger';
import { UpdatePriceLogObject } from './dto/update-price-log-object';
import { InventoryUpdatePriceLogEntity } from './entity/inventory-update-price-entity';

@Injectable()
export class InventoryUpdatePriceLogService {
  private readonly logger = new CustomLogger(
    InventoryUpdatePriceLogService.name,
  );
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(InventoryUpdatePriceLogEntity)
    private readonly updatePriceLogObjectRepository: Repository<InventoryUpdatePriceLogEntity>,
  ) {}

  async insertPriceLogObject(updateLogObject: UpdatePriceLogObject) {
    await this.updatePriceLogObjectRepository.save(updateLogObject);
  }
}
