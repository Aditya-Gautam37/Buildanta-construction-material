import { Module } from '@nestjs/common';
import { StagesController } from './stages.controller';
import { StagesService } from './stages.service';
import { TaxonomyLinksModule } from '../taxonomy-links/taxonomy-links.module';

@Module({
  imports: [TaxonomyLinksModule],
  controllers: [StagesController],
  providers: [StagesService]
})
export class StagesModule {}
