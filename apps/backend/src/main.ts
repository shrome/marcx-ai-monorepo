import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { migrations } from '@marcx/db';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';

async function runMigrations() {
  try {
    await migrations();
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

async function bootstrap() {
  await runMigrations();

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.enableCors({
    origin: [
      'https://staging.piofin.ai',
      'https://ai.marinecx.com',
      ...(process.env.NODE_ENV === 'development'
        ? ['http://localhost:3000']
        : []),
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // OpenAPI / Scalar docs (non-production only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Marcx AI API')
      .setDescription('AI-powered accounting ledger platform API')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Raw OpenAPI JSON + Swagger UI at /api/docs/swagger
    SwaggerModule.setup('api/docs/swagger', app, document);

    // Scalar UI via CDN — avoids ESM/CJS conflict from the npm package
    const openApiJsonPath = '/api/docs/swagger-json';
    SwaggerModule.setup('api/docs/swagger', app, document, {
      jsonDocumentUrl: openApiJsonPath,
    });

    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/api/docs', (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/html');
      res.send(`<!doctype html>
<html>
  <head>
    <title>Marcx AI — API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      data-url="${openApiJsonPath}"
      data-configuration='{"theme":"kepler","layout":"modern"}'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`);
    });
  }

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
