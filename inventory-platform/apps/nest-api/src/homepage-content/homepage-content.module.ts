import { Module } from '@nestjs/common';
import { HomepageContentController } from './homepage-content.controller';
import { HomepageContentService } from './homepage-content.service';

@Module({
  controllers: [HomepageContentController],
  providers: [HomepageContentService],
})
export class HomepageContentModule {}
