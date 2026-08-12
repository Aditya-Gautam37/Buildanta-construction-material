import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

// Reused across warm invocations of the same function instance.
let appPromise: Promise<NestExpressApplication> | undefined;

async function bootstrap(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  await app.init();
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!appPromise) appPromise = bootstrap();
  const app = await appPromise;
  // An initialized Nest/Express app is itself a valid (req, res) request listener.
  app.getHttpAdapter().getInstance()(req, res);
}
