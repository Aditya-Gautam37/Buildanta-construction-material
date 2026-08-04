import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type PublicHomepageContent = {
  slides: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    altText: string;
    ctaLabel: string | null;
    ctaHref: string | null;
    sortOrder: number;
  }>;
  products: Array<{
    id: string;
    productId: string;
    badge: string | null;
    sortOrder: number;
  }>;
};

@Injectable()
export class HomepageContentService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(): Promise<PublicHomepageContent> {
    const [slides, products] = await Promise.all([
      this.prisma.client.homepageSlide.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          title: true,
          subtitle: true,
          imageUrl: true,
          altText: true,
          ctaLabel: true,
          ctaHref: true,
          sortOrder: true,
        },
      }),
      this.prisma.client.homepageProduct.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, productId: true, badge: true, sortOrder: true },
      }),
    ]);
    return { slides, products };
  }
}
