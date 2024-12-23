import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoneLogsEntity } from './entity/zone-logs.entity';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class ZoneLogsService {
  private readonly logger = new CustomLogger(ZoneLogsService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(ZoneLogsEntity)
    private readonly zoneLogsRepository: Repository<ZoneLogsEntity>,
  ) {}
  async save(
    lat: string,
    long: string,
    userId: string,
  ): Promise<ZoneLogsEntity> {
    return await this.zoneLogsRepository.save({
      latitude: lat,
      longitude: long,
      userId: userId,
    });
  }
}
