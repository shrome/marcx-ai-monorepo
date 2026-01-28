import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    const { stdout, stderr } = await execAsync('pnpm drizzle-kit migrate', {
      cwd: process.cwd() + '/../../packages/drizzle',
    });

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

async function bootstrap() {
  // Run migrations before initializing the app
  await runMigrations();

  const app = await NestFactory.create(AppModule);

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable cookie parser
  app.use(cookieParser());

  // Enable CORS with credentials
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
