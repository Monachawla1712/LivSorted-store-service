import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductKeywordHitsEntity } from './entity/product-keyword-hits.entity';
import { ProductSynonymsEntity } from './entity/product-synonyms.entity';
import { ProductSuggestionDto } from './dto/product-suggestion.dto';
import { Metaphone } from 'natural';
import { partial_ratio, token_set_ratio } from 'fuzzball';
import { QueryRunner, Repository } from 'typeorm';
import { NewProductKeywordHitDto } from './dto/product-keyword-hit.dto';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class SearchService {
  private readonly logger = new CustomLogger(SearchService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(ProductKeywordHitsEntity)
    private readonly productKeywordHitsEntityRepository: Repository<ProductKeywordHitsEntity>,
    @InjectRepository(ProductSynonymsEntity)
    private readonly productSynonymsEntityRepository: Repository<ProductSynonymsEntity>,
  ) {}

  async getProductSearch(
    keyword: string,
    token_set_ratio_threshold: number,
    partial_ratio_threshold: number,
  ): Promise<ProductSuggestionDto[]> {
    const topSuggestions: ProductSuggestionDto[] = [];
    const suggestions: ProductSuggestionDto[] = [];
    if (keyword != null) {
      const keywordPhonetic: string = Metaphone.process(keyword);
      const synonyms = await this.productSynonymsEntityRepository.find({
        where: { is_active: true },
      });
      const keywordHits = await this.productKeywordHitsEntityRepository.find({
        where: { keyword: keyword, is_active: true },
        select: ['hits', 'productCode'],
      });
      let keywordHitMap: Map<string, number> = new Map();
      if (keywordHits != null && keywordHits.length > 0)
        keywordHitMap = new Map(
          keywordHits.map((k) => [k.productCode, k.hits]),
        );

      synonyms.forEach((synonym) => {
        const token_set_match_score: number = token_set_ratio(
          keywordPhonetic,
          synonym.phonetic,
        );
        if (token_set_match_score > token_set_ratio_threshold) {
          const suggestionDto = new ProductSuggestionDto();
          suggestionDto.productCode = synonym.productCode;
          suggestionDto.score = keywordHitMap.has(synonym.productCode)
            ? +keywordHitMap.get(synonym.productCode) + token_set_match_score
            : token_set_match_score;
          topSuggestions.push(suggestionDto);
        } else {
          const partial_match_score: number = partial_ratio(
            keywordPhonetic,
            synonym.phonetic,
          );
          if (partial_match_score > partial_ratio_threshold) {
            const suggestionDto = new ProductSuggestionDto();
            suggestionDto.productCode = synonym.productCode;
            suggestionDto.score = keywordHitMap.has(synonym.productCode)
              ? +keywordHitMap.get(synonym.productCode) + partial_match_score
              : partial_match_score;
            suggestions.push(suggestionDto);
          }
        }
      });
      if (topSuggestions.length > 0) {
        topSuggestions.sort((a, b) => {
          return a.score >= b.score ? -1 : 1;
        });
      }
      if (suggestions.length > 0) {
        suggestions.sort((a, b) => {
          return a.score >= b.score ? -1 : 1;
        });
      }
    }
    return topSuggestions.concat(suggestions);
  }

  async createOrUpdateKeywordHit(
    productKeywordHitDto: NewProductKeywordHitDto,
  ) {
    try {
      const keywordHit = await this.productKeywordHitsEntityRepository.find({
        where: {
          keyword: productKeywordHitDto.keyword.trim(),
          productCode: productKeywordHitDto.productCode,
          is_active: true,
        },
      });
      let hit = 1;
      let id = null;
      if (keywordHit != null && keywordHit.length == 1) {
        hit += +keywordHit[0].hits;
        id = keywordHit[0].id;
      }
      await this.productKeywordHitsEntityRepository.save({
        id: id,
        hits: hit,
        keyword: productKeywordHitDto.keyword.trim(),
        productCode: productKeywordHitDto.productCode,
        is_active: true,
      });
      return { success: true };
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while adding product keyword hit',
        e,
      );
      throw new HttpException(
        { message: 'something went wrong' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSynonymsForAllProductCode(): Promise<Map<string, string>> {
    const productSynonymMap: Map<string, string> = new Map();
    const allSynonyms: ProductSynonymsEntity[] =
      await this.productSynonymsEntityRepository.find({
        where: { is_active: true },
        select: ['productCode', 'synonym'],
      });
    if (allSynonyms.length > 0) {
      allSynonyms.forEach((synonym) => {
        productSynonymMap.set(
          synonym.productCode,
          productSynonymMap.has(synonym.productCode)
            ? productSynonymMap.get(synonym.productCode) + ',' + synonym.synonym
            : synonym.synonym,
        );
      });
    }
    return productSynonymMap;
  }

  // todo: not in use
  async getSynonymsByProductCode(productCode: string): Promise<string> {
    const response: string[] = [];
    const synonyms = await this.productSynonymsEntityRepository.find({
      where: { is_active: true, productCode: productCode },
      select: ['synonym'],
    });
    synonyms.forEach((synonym) => {
      if (synonym.synonym != null) response.push(synonym.synonym);
    });
    return response.join(',');
  }

  async replaceSynonymsByProductCodeByQueryRunner(
    productCode: string,
    synonyms: string,
    queryRunner: QueryRunner,
  ): Promise<string[]> {
    let synonymList: string[] = synonyms.split(',');
    let synonymEntities: ProductSynonymsEntity[] = [];
    synonymList.forEach((syn) => {
      syn = syn.trim();
      if (syn.length > 0) {
        const entity: ProductSynonymsEntity = new ProductSynonymsEntity();
        entity.productCode = productCode;
        entity.synonym = syn;
        entity.phonetic = Metaphone.process(syn);
        synonymEntities.push(entity);
      }
    });
    synonymList = [];
    await queryRunner.manager
      .getRepository(ProductSynonymsEntity)
      .update(
        { is_active: true, productCode: productCode },
        { is_active: false },
      );

    synonymEntities = await queryRunner.manager
      .getRepository(ProductSynonymsEntity)
      .save(synonymEntities);
    synonymEntities.forEach((synonym) => {
      if (synonym.synonym != null) synonymList.push(synonym.synonym);
    });
    return synonymList;
  }
}
