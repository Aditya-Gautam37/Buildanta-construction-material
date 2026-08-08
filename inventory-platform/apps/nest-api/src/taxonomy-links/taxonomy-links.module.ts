import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TaxonomyLinksService } from './taxonomy-links.service';

@Module({
  imports: [DatabaseModule],
  providers: [TaxonomyLinksService],
  exports: [TaxonomyLinksService],
})
export class TaxonomyLinksModule {}
