import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MaterialKnowledgeController } from './material-knowledge.controller';
import { MaterialKnowledgeService } from './material-knowledge.service';
import { GeminiProvider } from './ai-provider';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [
    // forRootAsync (not forRoot) so the limit is read once ConfigService has
    // actually resolved, matching CartModule — a plain forRoot argument is
    // evaluated at import time, before .env is necessarily loaded.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        { ttl: 3_600_000, limit: Number(config.get('AI_QUESTIONS_PER_HOUR') ?? 15) },
      ],
    }),
  ],
  controllers: [MaterialKnowledgeController],
  providers: [MaterialKnowledgeService, GeminiProvider, PrismaService],
})
export class MaterialKnowledgeModule {}
