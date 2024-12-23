import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Config } from './config/configuration';
import { ValidationPipe } from '@nestjs/common';
import { LoggerFactory } from './common/logger-factory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: LoggerFactory('store_app'),
  });
  app.enableCors();
  app.setGlobalPrefix('store-app');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  const config = app.get<ConfigService<Config, true>>(ConfigService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Consumer store services')
    .setDescription('Consumer APIs for stores services')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'Authorization',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/store-app/docs', app, document);

  await app.listen(config.get<number>('port'));
}
bootstrap();
