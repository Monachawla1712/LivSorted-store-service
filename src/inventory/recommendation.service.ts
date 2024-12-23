import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecommendationEntity } from './entity/recommendation.entity';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class RecommendationService {
  private readonly logger = new CustomLogger(RecommendationService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(RecommendationEntity)
    private readonly recommendationRepository: Repository<RecommendationEntity>,
  ) {}

  async upsertRecommendations(recommendationArr) {
    await this.recommendationRepository.upsert(recommendationArr, {
      conflictPaths: ['sku_code', 'user_id'],
      skipUpdateIfNoValuesChanged: true,
    });
  }
}
