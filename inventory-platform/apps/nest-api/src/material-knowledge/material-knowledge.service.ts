import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { KnowledgeStatus, ProductStatus, type UserRole } from '@workspace/db';
import { PrismaService } from '../database/prisma.service';
import { CATALOGUE_WRITE_ROLES, MATERIAL_KNOWLEDGE_PUBLISH_ROLES, requireRole } from '../auth/roles';
import { GeminiProvider } from './ai-provider';
import { buildUserPrompt, buildVerifiedContext, sanitizeQuestion, SYSTEM_INSTRUCTION } from './grounded-prompt';

type UpsertInput = {
  summary?: string;
  useCases?: string[];
  suitableSurfaces?: string[];
  unsuitableSurfaces?: string[];
  preparationSteps?: string[];
  applicationSteps?: string[];
  sequenceNote?: string;
  mixingInstructions?: string;
  requiredTools?: string[];
  coverageValue?: number | null;
  coverageUnit?: string;
  coverageConditions?: string;
  numberOfCoats?: number | null;
  dryingCuringInfo?: string;
  safetyPrecautions?: string[];
  commonMistakes?: string[];
  professionalTips?: string[];
  technicalDataSheetUrl?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceRevision?: string;
  reviewNotes?: string;
};

type RelatedItemInput = {
  relatedProductId: string;
  role: string;
  reason: string;
  sequenceNote?: string;
  sortOrder?: number;
};

const relatedProductSelect = { id: true, name: true, status: true } as const;

@Injectable()
export class MaterialKnowledgeService {
  constructor(private readonly prisma: PrismaService, private readonly ai: GeminiProvider) {}

  private async requireProduct(productId: string) {
    const product = await this.prisma.client.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  // Staff list view: every published product, joined with its knowledge record
  // (null if one hasn't been started yet) so gaps are visible, not just
  // incomplete drafts.
  async listForStaff(): Promise<unknown[]> {
    const products = await this.prisma.client.product.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        brand: { select: { name: true } },
        materialKnowledge: {
          select: {
            id: true,
            status: true,
            summary: true,
            useCases: true,
            suitableSurfaces: true,
            safetyPrecautions: true,
            updatedAt: true,
            verifiedAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => ({
      productId: product.id,
      productName: product.name,
      productStatus: product.status,
      brand: product.brand?.name ?? null,
      knowledge: product.materialKnowledge
        ? {
            id: product.materialKnowledge.id,
            status: product.materialKnowledge.status,
            updatedAt: product.materialKnowledge.updatedAt,
            verifiedAt: product.materialKnowledge.verifiedAt,
            missingFields: this.missingRequiredFields(product.materialKnowledge),
          }
        : null,
    }));
  }

  async getForStaff(productId: string): Promise<unknown> {
    await this.requireProduct(productId);
    return this.prisma.client.materialKnowledge.findUnique({
      where: { productId },
      include: {
        relatedMaterials: {
          include: { relatedProduct: { select: relatedProductSelect } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  // Customer-facing: published knowledge only. A draft or archived record
  // must never be visible here, and its existence should not be
  // distinguishable from "no knowledge yet" (both 404).
  async getPublished(productId: string): Promise<unknown> {
    const knowledge = await this.loadPublished(productId);
    // Lets the storefront hide the question box when no AI provider is
    // configured, rather than offering an input that can only fail.
    return { ...knowledge, assistantAvailable: this.ai.isConfigured() };
  }

  private async loadPublished(productId: string) {
    const knowledge = await this.prisma.client.materialKnowledge.findUnique({
      where: { productId },
      include: {
        product: { select: { name: true, brand: { select: { name: true } } } },
        relatedMaterials: {
          // A related product that isn't live must not surface to a customer:
          // the link would 404, and the assistant would be pointing at
          // something that cannot be bought. Staff views keep the full list.
          where: { relatedProduct: { status: ProductStatus.PUBLISHED } },
          include: { relatedProduct: { select: relatedProductSelect } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!knowledge || knowledge.status !== KnowledgeStatus.PUBLISHED) {
      throw new NotFoundException('No verified material information is available for this product yet.');
    }
    return knowledge;
  }

  // Answers a customer question using only the published record above. The
  // model never sees the database, only the context built from it, so an
  // unpublished draft cannot leak into an answer.
  async ask(productId: string, question: string): Promise<{ answer: string }> {
    const sanitized = sanitizeQuestion(question);
    if (!sanitized) throw new BadRequestException('Please enter a question.');

    if (!this.ai.isConfigured()) {
      throw new ServiceUnavailableException('The material assistant is not available right now. The verified information shown here is still accurate.');
    }

    const knowledge = await this.loadPublished(productId);

    const context = buildVerifiedContext({
      productName: knowledge.product.name,
      brandName: knowledge.product.brand?.name ?? null,
      summary: knowledge.summary,
      useCases: knowledge.useCases,
      suitableSurfaces: knowledge.suitableSurfaces,
      unsuitableSurfaces: knowledge.unsuitableSurfaces,
      preparationSteps: knowledge.preparationSteps,
      applicationSteps: knowledge.applicationSteps,
      sequenceNote: knowledge.sequenceNote,
      mixingInstructions: knowledge.mixingInstructions,
      requiredTools: knowledge.requiredTools,
      coverageValue: knowledge.coverageValue == null ? null : String(knowledge.coverageValue),
      coverageUnit: knowledge.coverageUnit,
      coverageConditions: knowledge.coverageConditions,
      numberOfCoats: knowledge.numberOfCoats,
      dryingCuringInfo: knowledge.dryingCuringInfo,
      safetyPrecautions: knowledge.safetyPrecautions,
      commonMistakes: knowledge.commonMistakes,
      professionalTips: knowledge.professionalTips,
      relatedMaterials: knowledge.relatedMaterials.map((item) => ({
        name: item.relatedProduct.name,
        role: item.role,
        reason: item.reason,
      })),
    });

    const result = await this.ai.answer(SYSTEM_INSTRUCTION, buildUserPrompt(context, sanitized));

    if (!result.ok) {
      // Every failure mode reads the same to the customer: the assistant is
      // unavailable, the verified information above is not.
      throw new ServiceUnavailableException(
        result.reason === 'blocked'
          ? 'That question could not be answered here. Please rephrase it, or ask our team.'
          : 'The material assistant is unavailable right now. The verified information shown here is still accurate.',
      );
    }

    // The question and answer are deliberately not persisted anywhere.
    return { answer: result.text };
  }

  async upsert(productId: string, input: UpsertInput, role: UserRole): Promise<unknown> {
    requireRole(role, CATALOGUE_WRITE_ROLES, 'Editing material knowledge');
    await this.requireProduct(productId);
    return this.prisma.client.materialKnowledge.upsert({
      where: { productId },
      create: { productId, ...input },
      update: { ...input },
    });
  }

  async publish(productId: string, userId: string, role: UserRole): Promise<unknown> {
    requireRole(role, MATERIAL_KNOWLEDGE_PUBLISH_ROLES, 'Publishing material knowledge');
    const knowledge = await this.prisma.client.materialKnowledge.findUnique({ where: { productId } });
    if (!knowledge) throw new NotFoundException('Add material knowledge before publishing.');
    const missing = this.missingRequiredFields(knowledge);
    if (missing.length > 0) {
      throw new BadRequestException(`Cannot publish: missing ${missing.join(', ')}.`);
    }
    return this.prisma.client.materialKnowledge.update({
      where: { productId },
      data: { status: KnowledgeStatus.PUBLISHED, verifiedById: userId, verifiedAt: new Date() },
    });
  }

  async archive(productId: string, role: UserRole): Promise<unknown> {
    requireRole(role, MATERIAL_KNOWLEDGE_PUBLISH_ROLES, 'Archiving material knowledge');
    const knowledge = await this.prisma.client.materialKnowledge.findUnique({ where: { productId } });
    if (!knowledge) throw new NotFoundException('No material knowledge exists for this product.');
    return this.prisma.client.materialKnowledge.update({
      where: { productId },
      data: { status: KnowledgeStatus.ARCHIVED },
    });
  }

  async replaceRelated(productId: string, items: RelatedItemInput[], role: UserRole): Promise<unknown> {
    requireRole(role, CATALOGUE_WRITE_ROLES, 'Editing related materials');
    const knowledge = await this.prisma.client.materialKnowledge.findUnique({ where: { productId } });
    if (!knowledge) throw new NotFoundException('Add material knowledge before linking related materials.');

    if (items.some((item) => item.relatedProductId === productId)) {
      throw new BadRequestException('A product cannot be related to itself.');
    }
    const relatedIds = items.map((item) => item.relatedProductId);
    if (new Set(relatedIds).size !== relatedIds.length) {
      throw new BadRequestException('Each related product may only be linked once.');
    }
    if (relatedIds.length > 0) {
      const found = await this.prisma.client.product.count({ where: { id: { in: relatedIds } } });
      if (found !== relatedIds.length) throw new BadRequestException('One or more related products were not found.');
    }

    return this.prisma.client.$transaction(async (tx) => {
      await tx.materialRelatedProduct.deleteMany({ where: { materialKnowledgeId: knowledge.id } });
      if (items.length > 0) {
        await tx.materialRelatedProduct.createMany({
          data: items.map((item, index) => ({
            materialKnowledgeId: knowledge.id,
            relatedProductId: item.relatedProductId,
            role: item.role as never,
            reason: item.reason,
            sequenceNote: item.sequenceNote,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }
      return tx.materialRelatedProduct.findMany({
        where: { materialKnowledgeId: knowledge.id },
        include: { relatedProduct: { select: relatedProductSelect } },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  // The minimum bar for publication: enough for the AI assistant to say
  // something useful and safe. Deliberately does not require every field —
  // some products genuinely have nothing to say about, e.g., mixing ratio.
  private missingRequiredFields(knowledge: { summary: string | null; useCases: string[]; suitableSurfaces: string[]; safetyPrecautions: string[] }) {
    const missing: string[] = [];
    if (!knowledge.summary?.trim()) missing.push('a summary');
    if (knowledge.useCases.length === 0 && knowledge.suitableSurfaces.length === 0) {
      missing.push('use cases or suitable surfaces');
    }
    if (knowledge.safetyPrecautions.length === 0) missing.push('safety precautions');
    return missing;
  }
}
