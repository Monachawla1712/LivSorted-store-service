import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';
import { Config } from 'src/config/configuration';

@Injectable()
export class RestApiService {
    private defaultTimeout: number;
    constructor(
        private configService: ConfigService<Config, true>,
    ) {
        this.defaultTimeout = this.configService.get<number>('default_timeout');
    }

    async makeRequest(options: AxiosRequestOptions) {
        const { url, method, data, headers, timeout = this.defaultTimeout, params } = options;

        const axiosOptions: AxiosRequestConfig = {
            url,
            method,
            data,
            headers: {
                ...headers,
            },
            timeout,
            params,
        };

        try {
            const result = await axios(axiosOptions);
            return result.data;
        } catch (error) {
            throw error;
        }
    }
}
