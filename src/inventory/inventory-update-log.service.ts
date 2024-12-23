import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateLogObject } from './dto/update-log-object';
import { Repository } from 'typeorm';
import { InventoryUpdateLogEntity } from './entity/inventory-update-log.entity';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { CustomLogger } from '../common/custom-logger';

@Injectable()
export class InventoryUpdateLogService {
  private readonly logger = new CustomLogger(InventoryUpdateLogService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(InventoryUpdateLogEntity)
    private readonly updateLogObjectRepository: Repository<InventoryUpdateLogEntity>,
  ) {}

  async insertLogObject(updateLogObject: UpdateLogObject) {
    await this.updateLogObjectRepository.save(updateLogObject);
  }
}
