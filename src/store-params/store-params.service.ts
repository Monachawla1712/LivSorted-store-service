import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { StoreParamsEntity } from './store-params.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderParamsEntity } from './order-params.entity';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { LocalCache } from '../common/utils/local-cache-utils';
import { DURATION_IN_SECOND } from '../common/constants/common-constants';

@Injectable()
export class StoreParamsService {
  private readonly logger = new CustomLogger(StoreParamsService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(StoreParamsEntity)
    private readonly storeParamsRepository: Repository<StoreParamsEntity>,
    @InjectRepository(OrderParamsEntity)
    private readonly orderParamsRepository: Repository<OrderParamsEntity>,
  ) {}

  async getNumberParamValue(paramKey: string, defaultValue: number) {
    try {
      const param = await this.storeParamsRepository.findOne({
        where: { param_key: paramKey },
      });
      if (param == null) {
        return defaultValue;
      }
      return Number(param.param_value);
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching paramKey :' + paramKey,
        e,
      );
      return defaultValue;
    }
  }

  async getStringParamValue(paramKey: string, defaultValue: string) {
    try {
      const param = await this.storeParamsRepository.findOne({
        where: { param_key: paramKey },
      });
      if (param == null) {
        return defaultValue;
      }
      return param.param_value;
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching paramKey :' + paramKey,
        e,
      );
      return defaultValue;
    }
  }

  async getJsonParamValue(paramKey: string, defaultValue: any): Promise<any> {
    try {
      const param = await this.storeParamsRepository.findOne({
        where: { param_key: paramKey },
      });
      if (param == null) {
        return defaultValue;
      }
      return JSON.parse(param.param_value);
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching paramKey :' + paramKey,
        e,
      );
      return defaultValue;
    }
  }

  async getNumberOrderParamValue(paramKey: string, defaultValue: number) {
    try {
      const param = await this.orderParamsRepository.findOne({
        where: { param_key: paramKey },
      });
      if (param == null) {
        return defaultValue;
      }
      return Number(param.param_value);
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching paramKey :' + paramKey,
        e,
      );
      return defaultValue;
    }
  }

  async updateAndFetch(key: string) {
    const updatedParams = await this.storeParamsRepository
      .createQueryBuilder()
      .update(StoreParamsEntity)
      .set({ param_value: () => '"param_value"::integer + 1' })
      .where('param_key = :key', { key })
      .returning('param_value')
      .execute();

    if (updatedParams.raw.length > 0) {
      return updatedParams.raw[0].param_value;
    } else {
      return null;
    }
  }

  async updateAndFetchParam(key: string, value: any) {
    const updatedParams = await this.storeParamsRepository
      .createQueryBuilder()
      .update(StoreParamsEntity)
      .set({ param_value: value })
      .where('param_key = :key', { key })
      .returning('param_value')
      .execute();

    if (updatedParams.raw.length > 0) {
      return updatedParams.raw[0].param_value;
    } else {
      return null;
    }
  }

  async getCachedStringParamValue(key: string, defaultValue: string) {
    let cachedValue = LocalCache.getValue(key);
    if (cachedValue == null) {
      cachedValue = await this.getStringParamValue(key, defaultValue);
      LocalCache.setValue(key, cachedValue, DURATION_IN_SECOND.HR_2);
    }
    return cachedValue;
  }

  async getCachedJsonParamValue(key: string, defaultValue: any) {
    let cachedValue = LocalCache.getValue(key);
    if (cachedValue == null) {
      cachedValue = await this.getJsonParamValue(key, defaultValue);
      LocalCache.setValue(key, cachedValue, DURATION_IN_SECOND.HR_2);
    }
    return cachedValue;
  }
}
