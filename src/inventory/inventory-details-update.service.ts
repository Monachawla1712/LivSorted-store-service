import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { CustomLogger } from '../common/custom-logger';
import { InventoryDetailsUpdateLogEntity } from './entity/inventory-details-update-log.entity';

@Injectable()
export class InventoryDetailsUpdateLogService {
  private readonly logger = new CustomLogger(InventoryDetailsUpdateLogService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(InventoryDetailsUpdateLogEntity)
    private readonly inventoryDetailsUpdateRepository: Repository<InventoryDetailsUpdateLogEntity>,
  ) {}

  async insertLogObject(updateLogObject) {
    try {
      await this.inventoryDetailsUpdateRepository.save(updateLogObject);
    } catch (e) {
      console.log(e);
    }
  }
}
