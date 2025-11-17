require('dotenv').config();

import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());

  // Allow multiple origins configured via FRONTEND_ORIGINS env (comma-separated).
  // Example: FRONTEND_ORIGINS="http://localhost:3000,https://<your-preview>.app.github.dev:3001"
  const raw = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || '';
  const allowedOrigins = raw.split(',').map(s => s.trim()).filter(Boolean);
  console.log('Allowed frontend origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow backend tools
      console.log('CORS incoming origin:', origin);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn('CORS denied origin:', origin);
      return callback(new Error(`CORS origin denied: ${origin}`));
    },
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server running at https://ominous-doodle-g459qvv9r7j4f97wx-3000.app.github.dev`);
}

bootstrap();
