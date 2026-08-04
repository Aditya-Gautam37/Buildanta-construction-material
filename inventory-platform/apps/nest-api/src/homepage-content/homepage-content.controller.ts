import { Controller, Get } from '@nestjs/common';
import { HomepageContentService, type PublicHomepageContent } from './homepage-content.service';

@Controller('homepage-content')
export class HomepageContentController {
  constructor(private readonly homepageContentService: HomepageContentService) {}

  @Get()
  findPublic(): Promise<PublicHomepageContent> {
    return this.homepageContentService.findPublic();
  }
}
