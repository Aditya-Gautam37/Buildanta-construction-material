// src/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // This makes PrismaService available everywhere without re-importing DatabaseModule
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}