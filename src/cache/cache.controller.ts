import { Get, Controller, Param, Res, HttpStatus } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CustomLogger } from '../common/custom-logger';

@Controller('cache')
export class CacheController {

    private readonly logger = new CustomLogger(CacheController.name);

    constructor(
        private cacheService: CacheService,
    ) { }

    @Get('invalidate/all/:pwd')
    async invalidateAllCache(@Res() res, @Param("pwd") password: string) {
        await this.cacheService.invalidateAllCache(password);
        res.status(HttpStatus.OK).send("Cache invalidated succesfully.");
    }

    @Get('invalidate/:id/:pwd')
    async invalidateCacheById(@Res() res, @Param("id") key: string, @Param("pwd") password: string) {
        await this.cacheService.invalidateByIdCache(password, key);
        res.status(HttpStatus.OK).send("Cache invalidated succesfully.");
    }
}
