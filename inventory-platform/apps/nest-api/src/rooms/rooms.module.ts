import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { TaxonomyLinksModule } from '../taxonomy-links/taxonomy-links.module';

@Module({
  imports: [TaxonomyLinksModule],
  controllers: [RoomsController],
  providers: [RoomsService]
})
export class RoomsModule {}
