import {
  Body,
  Controller,
  Post,
  UseFilters,
  Patch,
  Param,
  Get,
  Delete,
  Headers,
} from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from 'src/common/http-exception.filter';
import { CategoriesService } from './categories.service';
import { CreateCategoriesDto } from './dto/createCategories.dto';
import { UpdateCategoriesDto } from './dto/updateCategories.dto';
import { Categories } from './entity/categories.entity';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Controller('categories')
@ApiTags('Categories')
@UseFilters(HttpExceptionFilter)
export class CategoriesController {
  private readonly logger = new CustomLogger(CategoriesController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private categoriesService: CategoriesService,
  ) {}

  @ApiBody({ type: CreateCategoriesDto })
  @Post()
  @ApiResponse({ type: Categories })
  createCategory(
    @Body() reqBody: CreateCategoriesDto,
    @Headers('userId') createdBy: string,
  ): Promise<Categories> {
    return this.categoriesService.createCategory(reqBody, createdBy);
  }

  @ApiBody({ type: UpdateCategoriesDto })
  @ApiResponse({ type: Categories })
  @ApiParam({ name: 'categoryId', required: true })
  @Patch('/:categoryId')
  updateCategory(
    @Body() reqBody: UpdateCategoriesDto,
    @Param() param,
    @Headers('userId') createdBy: string,
  ): Promise<Categories> {
    const categoryId = parseInt(param.categoryId);
    return this.categoriesService.updateCategory(
      reqBody,
      categoryId,
      createdBy,
    );
  }

  @ApiResponse({ type: [Categories] })
  @Get()
  getAllCategories(): Promise<Categories[]> {
    return this.categoriesService.getAllCategories();
  }

  @Delete('/:categoryId')
  @ApiParam({ name: 'categoryId', required: true })
  deleteCategory(@Param() param): Promise<{ deleted: true }> {
    const categoryId = parseInt(param.categoryId);
    return this.categoriesService.deleteCategory(categoryId);
  }
}
