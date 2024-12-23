import { DataSource, In, Repository } from 'typeorm';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { ProductEntity } from './entity/products.entity';
import { xlsx } from 'src/common/xlsxToJson.helper';
import { isArray, validate } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProductTagsDto } from './dto/updateProductTags.dto';
import { MasterSkuDto } from './dto/masterSku.dto';
import { SearchService } from '../search/search.service';
import { ProductDetailsDto } from './dto/productDetails.dto';
import { CategoriesService } from '../categories/categories.service';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { ProductMetadataDto } from './dto/product-metadata.dto';
import { StoreParamsService } from '../store-params/store-params.service';
import { Unit } from './enum/unit.enum';
import { ConsumerContentsDto } from './dto/consumerContents.dto';
import { ProductPerPcWtRequest } from './dto/productPerPcWtRequest.dto';
import { GstInfoDto } from '../inventory/dto/gstInfo.dto';
import { RestApiService } from 'src/common/rest-api.service';
import { SkuPerPcsWtDto } from './dto/sku-per-pcs-wt.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new CustomLogger(ProductsService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private dataSource: DataSource,
    private searchService: SearchService,
    private categoriesService: CategoriesService,
    private storeParamsService: StoreParamsService,
    private restApiService: RestApiService,
  ) {}

  async createProduct(
    productBody: CreateProductDto,
    updatedBy: string,
  ): Promise<ProductDetailsDto> {
    const productDetail = new ProductDetailsDto();
    let product: ProductEntity = new ProductEntity();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      product.category = await this.categoriesService.getCategoryById(
        productBody.category_id,
      );
      const categoryName = product.category.name;
      product.metadata = new ProductMetadataDto();
      if (productBody.classes) product.metadata.classes = productBody.classes;
      delete productBody.classes;
      if (productBody.tags) product.metadata.contents = productBody.tags;
      delete productBody.tags;
      product.metadata.partnerContents = !productBody.partnerContents
        ? []
        : productBody.partnerContents;
      delete productBody.partnerContents;
      product.metadata.secondaryUomDetails = !productBody.secondaryUomDetails
        ? []
        : productBody.secondaryUomDetails;
      delete productBody.secondaryUomDetails;
      product.metadata.defaultUom = !productBody.defaultUom
        ? productBody.unit_of_measurement
        : productBody.defaultUom;
      delete productBody.defaultUom;
      product.metadata.showToggleOnApp =
        productBody.showToggleOnApp != null
          ? productBody.showToggleOnApp
          : false;
      delete productBody.showToggleOnApp;
      if (productBody.showMoreDetails) {
        product.metadata.showMoreDetails = productBody.showMoreDetails;
      }
      delete productBody.showMoreDetails;
      if (productBody.showNearSign) {
        product.metadata.showNearSign = productBody.showNearSign;
      }
      delete productBody.showNearSign;
      if (productBody.repeatItem) {
        product.metadata.repeatItem = productBody.repeatItem;
      }
      delete productBody.repeatItem;
      if (productBody.otherAppPrice) {
        product.metadata.otherAppPrice = productBody.otherAppPrice;
      }
      delete productBody.otherAppPrice;
      if (productBody.showFixedPrice) {
        product.metadata.showFixedPrice = productBody.showFixedPrice;
      }
      delete productBody.showFixedPrice;
      if (product.consumer_contents == null) {
        product.consumer_contents = new ConsumerContentsDto();
      }
      if (productBody.identifier) {
        product.consumer_contents.identifier = productBody.identifier;
      }
      delete productBody.identifier;
      if (productBody.consumerClasses) {
        product.consumer_contents.classes = productBody.consumerClasses;
      }
      delete productBody.consumerClasses;
      if (productBody.farmerStory) {
        product.consumer_contents.farmerStory = productBody.farmerStory;
      }
      delete productBody.farmerStory;
      if (productBody.procurementType) {
        product.consumer_contents.procurementType = productBody.procurementType;
        product.consumer_contents.procurementTypeExpiry = productBody.procurementTypeExpiry;
      }
      delete productBody.procurementTypeExpiry;
      delete productBody.procurementType;
      if (productBody.moreAboutMe) {
        product.consumer_contents.moreAboutMe = productBody.moreAboutMe;
      }
      delete productBody.moreAboutMe;
      if (productBody.highlightType) {
        product.consumer_contents.highlightType = productBody.highlightType;
      }
      delete productBody.highlightType;
      if(productBody.shelfLife){
        product.consumer_contents.shelfLife = productBody.shelfLife;
      }
      delete productBody.shelfLife;
      if (productBody.disclaimer) {
        product.consumer_contents.disclaimer = productBody.disclaimer;
      }
      delete productBody.disclaimer;
      if (productBody.productDetails) {
        product.consumer_contents.productDetails = productBody.productDetails;
      }
      delete productBody.productDetails;
      if (productBody.images) {
        product.consumer_contents.images = productBody.images;
      }
      delete productBody.images;
      if (productBody.origin) {
        product.consumer_contents.origin = productBody.origin;
      }
      delete productBody.origin;
      if (productBody.gst) {
        product.metadata.gst = productBody.gst;
      } else {
        product.metadata.gst = new GstInfoDto();
      }
      delete productBody.gst;
      Object.assign(product, productBody);
      product.updated_by = updatedBy;
      product.sku_code = product.sku_code.trim();
      product.name = product.name.trim();
      product.display_name = product.display_name.trim();
      product.enablePiecesRequest = productBody.enablePiecesRequest;
      product.hsn = productBody.hsn;
      product = await queryRunner.manager.save(product);
      Object.assign(productDetail, product);
      productDetail.tags = product.metadata.contents;
      productDetail.collection_tags = product.metadata.collections;
      productDetail.synonyms = (
        await this.searchService.replaceSynonymsByProductCodeByQueryRunner(
          product.sku_code,
          productBody.synonyms,
          queryRunner,
        )
      ).join(',');
      await this.CreateOrUpdateMasterSkuInWareHouse(
        this.getMasterSkuDtoFromProduct(product, categoryName),
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.handleProductSaveOrUpdateErrors(err);
    } finally {
      await queryRunner.release();
    }
    return productDetail;
  }

  async updateProduct(
    productBody: UpdateProductDto,
    productId: number,
    updatedBy: string,
  ): Promise<ProductDetailsDto> {
    const productDetail = new ProductDetailsDto();
    let product: ProductEntity = null;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      product = (
        await this.getProductsWithCategories({
          id: productId,
        })
      )[0];

      if (!product) {
        throw new HttpException(
          { message: 'product not found' },
          HttpStatus.NOT_FOUND,
        );
      }
      if (productBody.sku_code) {
        product.sku_code = productBody.sku_code.trim();
      }
      delete productBody.sku_code;
      if (productBody.tags) {
        product.metadata.contents = productBody.tags;
      }
      delete productBody.tags;
      let categoryName = product.category.name;
      if (productBody.category_id) {
        product.category = await this.categoriesService.getCategoryById(
          productBody.category_id,
        );
        categoryName = product.category.name;
      }
      if (productBody.classes) product.metadata.classes = productBody.classes;
      delete productBody.classes;
      if (productBody.consumerClasses) {
        if (product.consumer_contents == null) {
          product.consumer_contents = new ConsumerContentsDto();
        }
        product.consumer_contents.classes = productBody.consumerClasses;
      }
      delete productBody.consumerClasses;
      if (productBody.partnerContents) {
        product.metadata.partnerContents = productBody.partnerContents;
      }
      delete productBody.partnerContents;
      if (productBody.secondaryUomDetails) {
        product.metadata.secondaryUomDetails = productBody.secondaryUomDetails;
      }
      delete productBody.secondaryUomDetails;
      if (productBody.defaultUom) {
        product.metadata.defaultUom = productBody.defaultUom;
      }
      delete productBody.defaultUom;
      if (productBody.showToggleOnApp != null) {
        product.metadata.showToggleOnApp = productBody.showToggleOnApp;
      }
      delete productBody.showToggleOnApp;
      product.metadata.otherAppPrice = productBody.otherAppPrice;
      delete productBody.otherAppPrice;
      product.metadata.showMoreDetails = productBody.showMoreDetails;
      delete productBody.showMoreDetails;
      product.metadata.showNearSign = productBody.showNearSign;
      delete productBody.showNearSign;
      product.metadata.repeatItem = productBody.repeatItem;
      delete productBody.repeatItem;
      product.metadata.showFixedPrice = productBody.showFixedPrice;
      delete productBody.showFixedPrice;
      if (product.consumer_contents == null) {
        product.consumer_contents = new ConsumerContentsDto();
      }
      product.consumer_contents.identifier = productBody.identifier;
      // if (productBody.identifier) {
      // }
      delete productBody.identifier;
      if (productBody.farmerStory) {
        product.consumer_contents.farmerStory = productBody.farmerStory;
      }
      delete productBody.farmerStory;
      if (
        productBody.procurementType == null ||
        productBody.procurementType.trim() === ''
      ) {
        product.consumer_contents.procurementTypeExpiry = null;
      } else {
        product.consumer_contents.procurementTypeExpiry = productBody.procurementTypeExpiry;
      }
      delete productBody.procurementTypeExpiry;
      product.consumer_contents.procurementType = productBody.procurementType;
      delete productBody.procurementType;
      product.consumer_contents.moreAboutMe = productBody.moreAboutMe;
      delete productBody.moreAboutMe;
      product.consumer_contents.highlightType = productBody.highlightType;
      delete productBody.highlightType;
      product.consumer_contents.shelfLife = productBody.shelfLife;
      delete productBody.shelfLife;
      product.consumer_contents.disclaimer = productBody.disclaimer;
      delete productBody.disclaimer;
      product.consumer_contents.productDetails = productBody.productDetails;
      delete productBody.productDetails;
      product.consumer_contents.images = productBody.images;
      delete productBody.images;
      product.consumer_contents.origin = productBody.origin;
      delete productBody.origin;
      product.metadata.gst = productBody.gst ?? product.metadata?.gst;
      delete productBody.gst;
      if (productBody.hsn) {
        product.hsn = productBody.hsn;
      }
      delete productBody.hsn;
      Object.assign(product, productBody);
      product.updated_by = updatedBy;
      product.sku_code = product.sku_code.trim();
      product.name = product.name.trim();
      product.display_name = product.display_name.trim();
      product.enablePiecesRequest = productBody.enablePiecesRequest;
      product = await queryRunner.manager.save(product);
      Object.assign(productDetail, product);
      productDetail.tags = product.metadata.contents;
      productDetail.collection_tags = product.metadata.collections;
      if (productBody.synonyms != null) {
        productDetail.synonyms = (
          await this.searchService.replaceSynonymsByProductCodeByQueryRunner(
            product.sku_code,
            productBody.synonyms,
            queryRunner,
          )
        ).join(',');
      } else productDetail.synonyms = null;
      await this.CreateOrUpdateMasterSkuInWareHouse(
        this.getMasterSkuDtoFromProduct(product, categoryName),
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.handleProductSaveOrUpdateErrors(err);
    } finally {
      await queryRunner.release();
    }
    return productDetail;
  }

  async getAllProduct(filters: any = {}): Promise<ProductEntity[]> {
    const filter: {
      id?: number;
      sku_code?: any;
      lithos_ref?: any;
      is_active?: any;
    } = {};
    if (filters?.id) filter.id = filters.id;
    if (filters.lithos_ref)
      filter.lithos_ref = In(
        filters.lithos_ref.split(',').map((x: string) => parseInt(x)),
      );
    if (filters.sku_code) filter.sku_code = In(filters.sku_code.split(','));
    if (filters.is_active) filter.is_active = filters.is_active;

    return await this.productRepository.find({
      where: {
        ...filter,
      },
    });
  }

  async getProductsWithCategories(filters: any = {}): Promise<ProductEntity[]> {
    const filter: {
      id?: number;
      is_active?: any;
    } = {};
    if (filters?.id) filter.id = filters.id;
    if (filters.is_active) filter.is_active = filters.is_active;

    return await this.productRepository.find({
      relations: ['category'],
      where: {
        ...filter,
      },
    });
  }

  async getAllSkus() {
    const products = await this.productRepository.find({
      where: {
        is_active: true,
      },
      select: ['sku_code'],
    });
    return products.map((product) => product.sku_code);
  }

  private async CreateOrUpdateMasterSkuInWareHouse(
    warehousePayload: MasterSkuDto,
  ): Promise<MasterSkuDto> {
    try {
      const warehouseURL = `${process.env.WAREHOUSE_URL}/api/v1/masterSkus`;
      return await this.restApiService.makeRequest({
        url: warehouseURL,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'rz-auth-key': process.env.RZ_AUTH_KEY,
        },
        data: warehousePayload,
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while updating master sku data in warehouse',
        e,
      );
      throw new HttpException(
        { message: 'something went wrong' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  //  for Delete Product
  // async deleteProduct(productId: number): Promise<{ deleted: true }> {
  //   const userRepository = this.dataSource.getRepository(Products);

  //   const category = await userRepository
  //     .createQueryBuilder()
  //     .update({ is_active: false })
  //     .where({
  //       id: productId,
  //       is_active: true,
  //     })
  //     .returning('*')
  //     .execute();

  //   if (!category.raw[0]) {
  //     throw new HttpException(
  //       { message: 'Category not found' },
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }

  //   return { deleted: true };
  // }

  // Validate Products JSON from XLSX data
  async validateData(
    data,
    createdBy,
  ): Promise<{ products: Array<UpdateProductDto>; err: Array<[]> }> {
    return new Promise((resolve) => {
      const err = [];
      const productData = [];
      data.forEach((element) => {
        const product = new UpdateProductDto();
        if (element.tags) {
          element.tags = JSON.parse(element.tags);
        }
        element.updated_by = createdBy;
        if (typeof element.lithos_ref === 'string') {
          delete element.lithos_ref;
        }
        delete element.id;
        delete element.updated_at;
        delete element.created_at;

        Object.assign(product, element);

        validate(product).then((errors) => {
          if (errors.length > 0) {
            const obj = { ...errors[0].target } as UpdateProductDto;
            err.push({
              sku_code: obj.sku_code,
              error: errors[0].constraints,
            });
          } else {
            productData.push(product);
          }
        });
      });

      resolve({ products: productData, err });
    });
  }

  async createDataXLSXProduct(fileName, createdBy) {
    const xlsxData = await xlsx(fileName);

    const data: { products: UpdateProductDto[]; err: Array<[]> } =
      await this.validateData(xlsxData, createdBy);

    try {
      await this.productRepository.upsert(data.products, {
        conflictPaths: ['name', 'sku_code'],
        skipUpdateIfNoValuesChanged: true,
      });

      if (!data.err[0]) {
        return { success: true };
      }
      return { success: false, error: data.err };
    } catch (e) {
      if (e.code === '23503') {
        throw new HttpException({ message: e.detail }, HttpStatus.NOT_FOUND);
      }
      if (e.code === '23505') {
        throw new HttpException(
          { message: e.detail },
          HttpStatus.EXPECTATION_FAILED,
        );
      }
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while upserting product log for : ' +
          JSON.stringify(data.products),
        e,
      );
      throw new HttpException(
        { message: 'Internal Server Error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getMasterSkuDtoFromProduct(
    product: ProductEntity,
    categoryName: string,
  ): MasterSkuDto {
    const obj = new MasterSkuDto();
    Object.assign(obj, {
      skuCode: product.sku_code,
      name: product.display_name,
      image: product.image_url,
      unit_of_measurement: product.unit_of_measurement,
      category: categoryName,
    });
    return obj;
  }

  private handleProductSaveOrUpdateErrors(e) {
    this.logger.error(
      this.asyncContext.get('traceId'),
      'Something went wrong while save or update products',
      e,
    );
    if (e.code === '23503') {
      throw new HttpException(
        { message: 'category_id not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (e.code === '23505') {
      throw new HttpException(
        { message: 'sku_code or name already exists' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (e.message === 'product not found') throw e;
    throw new HttpException(
      {
        message:
          e.message === 'something went wrong'
            ? e.message
            : 'Internal Server Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  async bulkUpdateProductTags(
    products: ProductEntity[],
    updateProductTagsDtos: UpdateProductTagsDto[],
  ) {
    const productMap: Map<string, ProductEntity> = products.reduce(
      (map, product) => {
        map.set(product.sku_code, product);
        return map;
      },
      new Map<string, ProductEntity>(),
    );
    const updatedProducts: ProductEntity[] = [];
    updateProductTagsDtos.forEach((updateProductTagsDto) => {
      const updatedProduct = productMap.get(
        updateProductTagsDto.skuCode.trim(),
      );
      if (updateProductTagsDto.collectionTags.trim()) {
        updatedProduct.metadata.collections =
          updateProductTagsDto.collectionTags.split(',').map((s) => s.trim());
      }
      if (updateProductTagsDto.classTags.trim()) {
        updatedProduct.metadata.classes = updateProductTagsDto.classTags
          .split(',')
          .map((s) => s.trim());
      }
      updatedProducts.push(updatedProduct);
    });
    await this.productRepository.save(updatedProducts);
  }

  async filterByTags(filters) {
    const products = await this.getProductsInfo(filters);
    let collectionTags = new Set();
    if (filters.tags) {
      if (isArray(filters.tags)) {
        collectionTags = new Set(filters.tags);
      } else {
        collectionTags.add(filters.tags);
      }
    }
    const skuCodes = new Set();
    for (let a = 0; a < products.length; a++) {
      if (products[a].metadata.collections != null)
        for (let b = 0; b < products[a].metadata.collections.length; b++) {
          {
            if (collectionTags.has(products[a].metadata.collections[b])) {
              skuCodes.add(products[a].sku_code);
            }
          }
        }
    }
    return skuCodes;
  }

  async filterByCategories(filters) {
    const categories_id = await this.categoriesService.getCategoryInfo(filters);
    const filter: {
      category_id?: any;
    } = { category_id: categories_id };
    return this.getProductsInfo(filter);
  }

  async getProductsInfo(filters) {
    const filter: {
      sku_code?: any;
      category_id?: any;
      is_active?: boolean;
    } = {};
    if (filters.sku_code) {
      if (isArray(filters.sku_code)) {
        filter.sku_code = In(filters.sku_code);
      } else {
        filter.sku_code = filters.sku_code;
      }
    }
    if (filters.all_sku_code == null) {
      filter.is_active = true;
    }

    if (filters.category_id) {
      if (isArray(filters.category_id)) {
        filter.category_id = In(filters.category_id);
      } else {
        filter.category_id = filters.category_id;
      }
    }
    return await this.productRepository.find({
      where: filter,
      select: ['sku_code', 'metadata'],
    });
  }
  async getAllProductDetails(): Promise<ProductDetailsDto[]> {
    const products: ProductEntity[] = await this.getProductsWithCategories();
    const productDetailList: ProductDetailsDto[] = [];
    if (products.length > 0) {
      const productSynonymMap: Map<string, string> =
        await this.searchService.getSynonymsForAllProductCode();
      products.forEach((product) => {
        const productDetail: ProductDetailsDto = new ProductDetailsDto();
        Object.assign(productDetail, product);
        productDetail.tags = product.metadata.contents;
        productDetail.collection_tags = product.metadata.collections;
        productDetail.synonyms = productSynonymMap.has(productDetail.sku_code)
          ? productSynonymMap.get(productDetail.sku_code)
          : null;
        productDetailList.push(productDetail);
      });
    }
    return productDetailList;
  }

  // todo: not in use
  async getProductById(id: number): Promise<ProductDetailsDto> {
    const productDetail = new ProductDetailsDto();
    const product: ProductEntity = await this.productRepository.findOneBy({
      id: id,
    });
    if (!product) {
      throw new HttpException(
        { message: 'product not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    Object.assign(productDetail, product);
    productDetail.enablePiecesRequest = product.enablePiecesRequest;
    productDetail.tags = product.metadata.contents;
    productDetail.collection_tags = product.metadata.collections;
    productDetail.synonyms = await this.searchService.getSynonymsByProductCode(
      productDetail.sku_code,
    );
    return productDetail;
  }

  async getCSVData() {
    const products = await this.getProductsInfo({});
    let csv = 'skuCode,collectionTags,classTags';
    for (let a = 0; a < products.length; a++) {
      if (
        products[a].sku_code != null &&
        (products[a].metadata.collections != null ||
          products[a].metadata.classes != null)
      ) {
        csv +=
          '\n"' +
          products[a].sku_code +
          '","' +
          products[a].metadata.collections +
          '","' +
          products[a].metadata.classes +
          '"';
      }
    }
    return csv;
  }

  async save(product: ProductEntity) {
    return await this.productRepository.save(product);
  }

  async getNewSkuCodeForPos() {
    const skuSeqNumber = await this.storeParamsService.updateAndFetch(
      'POS_SKU_CODE_SEQ',
    );
    if (skuSeqNumber == null) {
      throw new HttpException(
        { message: 'SKU CODE PARAM DOES NOT EXIST' },
        HttpStatus.BAD_REQUEST,
      );
    }
    return skuSeqNumber;
  }

  async getNewArticleNumber() {
    const articleSeqNumber = await this.storeParamsService.updateAndFetch(
      'POS_ARTICLE_NUM_SEQ',
    );
    if (articleSeqNumber == null) {
      throw new HttpException(
        { message: 'ARTICLE NUMBER PARAM DOES NOT EXIST' },
        HttpStatus.BAD_REQUEST,
      );
    }
    return articleSeqNumber;
  }

  async getProductsByIds(productsIds: string[]) {
    return await this.productRepository.find({
      where: { id: In(productsIds), is_active: true },
    });
  }

  async getPosMasterCatalog() {
    return await this.productRepository.find({
      where: {
        is_verified: true,
        is_active: true,
        sku_type: 'POS',
      },
      relations: ['category'],
    });
  }

  async createNewProductWithDetails(
    skuCode: string,
    name: string,
    displayName: string,
    imageUrl: string,
    marketPrice: number,
    salePrice: number,
    uom: Unit,
    articleNumber: number,
    categoryId: number,
    skuType: string,
    isVerified: boolean,
    userId: string,
  ) {
    const newProduct = ProductEntity.createNewProduct(
      skuCode,
      name,
      displayName,
      imageUrl,
      marketPrice,
      salePrice,
      uom,
      articleNumber,
      categoryId,
      skuType,
      isVerified,
      userId,
    );
    return await this.save(newProduct);
  }
  async updateProductVideo(productEntity: ProductEntity) {
    await this.productRepository.save(productEntity);
  }

  async getExistingProductsMap(skuCodes: string[]) {
    const products = await this.getProductsFromSkuCodes(skuCodes);
    return new Map(
      products.map((product) => {
        return [product.sku_code, product];
      }),
    );
  }

  private async getProductsFromSkuCodes(skuCodes: string[]) {
    return await this.productRepository.find({
      where: { sku_code: In(skuCodes) },
    });
  }

  async updateProductPerPcWt(
    productEntity: ProductEntity,
    reqBody: ProductPerPcWtRequest,
  ) {
    productEntity.per_pcs_weight = reqBody.per_pc_wt;
    await this.productRepository.save(productEntity);
    return productEntity;
  }

  async getProcurementTypeExpiryDate() {
    const expiryParamValue =
      await this.storeParamsService.getNumberOrderParamValue(
        'PROCUREMENT_TYPE_EXPIRY',
        7,
      );

    let expiryDate = new Date();
    expiryDate = new Date(
      expiryDate.setDate(expiryDate.getDate() + expiryParamValue),
    );
    return expiryDate;
  }

  async updatePerPcsWeight(skuPerPcsWtDtos: SkuPerPcsWtDto[], userId: string) {
    const products = await this.getExistingProductsMap(
      skuPerPcsWtDtos.map((dto) => dto.skuCode),
    );
    if (products.size === 0) return;

    const updatedProducts = [];
    for (const dto of skuPerPcsWtDtos) {
      const product = products.get(dto.skuCode);
      if (product.per_pcs_weight && product.per_pcs_weight !== dto.perPcsWt) {
        const percentageDifference =
          Math.abs(
            (dto.perPcsWt - product.per_pcs_weight) / product.per_pcs_weight,
          ) * 100;
        if (percentageDifference <= 20) {
          product.per_pcs_weight = dto.perPcsWt;
          product.updated_at = new Date();
          product.updated_by = userId;
          updatedProducts.push(product);
        }
      }
    }

    if (updatedProducts.length > 0) {
      await this.saveProducts(updatedProducts);
    }
  }

  async saveProducts(products: ProductEntity[]) {
    return await this.productRepository.save(products);
  }

  async getBySkuCode(skuCode: string) {
    return await this.productRepository.findOne({
      where: { sku_code: skuCode },
    });
  }
}
