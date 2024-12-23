import { BadRequestException, Injectable } from '@nestjs/common';
import { LocalCache } from 'src/common/utils/local-cache-utils';
import { CustomLogger } from '../common/custom-logger';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config/configuration';

@Injectable()
export class CacheService {

    private readonly logger = new CustomLogger(CacheService.name);

    constructor(
        private configService: ConfigService<Config, true>,
    ) { }

    async invalidateAllCache(password: string) {
        await this.validateCacheResetPassword(password);
        LocalCache.clearCache();
    }

    async invalidateByIdCache(password: string, key: string) {
        await this.validateCacheResetPassword(password);
        LocalCache.invalidateCache(key);
    }

    async validateCacheResetPassword(password: string) {
        const cacheValidationPassword = this.configService.get<string>('cacheInvalidatedPassword');
        if (password == cacheValidationPassword) {
            return true;
        }
        throw new BadRequestException("Please provide correct password to invalidate cache");
    }
}
