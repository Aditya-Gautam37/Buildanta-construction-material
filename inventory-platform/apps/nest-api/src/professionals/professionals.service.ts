import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfessionalType } from '@workspace/db';
import { PrismaService } from '../database/prisma.service';

export type PublicProfessional = {
  id: string;
  name: string;
  slug: string;
  type: ProfessionalType;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  location: string;
  yearsExperience: number;
  email: string | null;
  phone: string | null;
  website: string | null;
  portfolioUrl: string | null;
  services: string[];
  featured: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(type?: ProfessionalType): Promise<PublicProfessional[]> {
    return this.prisma.client.professional.findMany({
      where: { published: true, type },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(slug: string): Promise<PublicProfessional> {
    const professional = await this.prisma.client.professional.findFirst({
      where: { slug, published: true },
    });
    if (!professional) {
      throw new NotFoundException('Professional not found.');
    }
    return professional;
  }
}
