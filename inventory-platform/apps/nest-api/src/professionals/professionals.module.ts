import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
import { PackageEnquiriesService } from './package-enquiries.service';

@Module({
  imports: [
    // Enquiries write customer contact details to the database from an
    // unauthenticated endpoint, so the route needs a ceiling. forRootAsync
    // (not forRoot) so the limit is read once ConfigService has resolved,
    // matching CartModule.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        { ttl: 3_600_000, limit: Number(config.get('PACKAGE_ENQUIRIES_PER_HOUR') ?? 10) },
      ],
    }),
  ],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, PackageEnquiriesService],
})
export class ProfessionalsModule {}
