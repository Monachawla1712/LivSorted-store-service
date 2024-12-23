import { DataSource, In, Repository } from 'typeorm';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCategoriesDto } from './dto/createCategories.dto';
import { Categories } from './entity/categories.entity';
import { UpdateCategoriesDto } from './dto/updateCategories.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { isArray } from 'class-validator';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class CategoriesService {
  private readonly logger = new CustomLogger(CategoriesService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private dataSource: DataSource,
    @InjectRepository(Categories)
    private readonly categoriesRepository: Repository<Categories>,
  ) {}

  async createCategory(
    categoryBody: CreateCategoriesDto,
    updatedBy: string,
  ): Promise<Categories> {
    const categoriesRepository = this.dataSource.getRepository(Categories);
    try {
      return await categoriesRepository.save({
        ...categoryBody,
        updated_by: updatedBy,
      });
    } catch (e) {
      if (e.code === '23505') {
        throw new HttpException(
          { message: 'category name already exists' },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while creating category',
        e,
      );
      throw new HttpException(
        { message: 'Internal Server Error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateCategory(
    categoryBody: UpdateCategoriesDto,
    categoryId: number,
    updatedBy: string,
  ): Promise<Categories> {
    const userRepository = this.dataSource.getRepository(Categories);

    try {
      const category = await userRepository
        .createQueryBuilder()
        .update({ ...categoryBody, updated_by: updatedBy })
        .where({
          id: categoryId,
          is_active: true,
        })
        .returning('*')
        .execute();

      if (!category.raw[0]) {
        throw new HttpException(
          { message: 'Category not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      return category.raw[0];
    } catch (e) {
      if (e.code === '23505') {
        throw new HttpException(
          { message: 'category name already exists' },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while updating category',
        e,
      );
      throw new HttpException(
        { message: 'Internal Server Error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllCategories(): Promise<Categories[]> {
    const userRepository = this.dataSource.getRepository(Categories);
    return await userRepository.findBy({ is_active: true });
  }

  async deleteCategory(categoryId: number): Promise<{ deleted: true }> {
    const userRepository = this.dataSource.getRepository(Categories);

    const category = await userRepository
      .createQueryBuilder()
      .update({ is_active: false })
      .where({
        id: categoryId,
        is_active: true,
      })
      .returning('*')
      .execute();

    if (!category.raw[0]) {
      throw new HttpException(
        { message: 'Category not found' },
        HttpStatus.NOT_FOUND,
      );
    }

    return { deleted: true };
  }

  async getCategoryById(id: number): Promise<Categories> {
    return await this.categoriesRepository.findOneBy({
      id: id,
    });
  }

  async getCategoryInfo(filters) {
    const filter: {
      name?: any;
      is_active?: boolean;
    } = {};
    if (filters.categories) {
      if (isArray(filters.categories)) {
        filter.name = In(filters.categories);
      } else {
        filter.name = filters.categories;
      }
    }
    filter.is_active = true;
    const categories = await this.categoriesRepository.find({
      where: filter,
      select: ['id'],
    });
    return categories.map((category) => category.id);
  }
}
