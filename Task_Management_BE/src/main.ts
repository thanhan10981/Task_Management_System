import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/error-handler/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT) || 3001;

  const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter((origin, index, all) => Boolean(origin) && all.indexOf(origin) === index) as string[];
  
  app.setGlobalPrefix('api');
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Use cookie parser middleware
  app.use(cookieParser());
  
  // Global pipes, interceptors, and filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(
    app.get(LoggingInterceptor),
    app.get(ResponseInterceptor),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('API documentation for Task Management System')
    .setVersion('1.0')
    .addCookieAuth('accessToken')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);

  await app.listen(port);
  console.log(`Swagger docs at http://localhost:${port}/api`);
}
bootstrap();
