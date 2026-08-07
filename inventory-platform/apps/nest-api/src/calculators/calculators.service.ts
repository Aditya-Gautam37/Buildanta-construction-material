import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CalculatorDefinitionStatus,
  CalculatorQualityTier,
  CalculatorVersionStatus,
  MaterialEstimateStatus,
  Prisma,
  ProductStatus,
  RoomType,
  UserRole,
  VariantStatus,
} from '@workspace/db';
import { InventoryLocationsService } from '../inventory-locations/inventory-locations.service';
import { QuoteRequestsService } from '../quote-requests/quote-requests.service';
import { PrismaService } from '../database/prisma.service';
import { PlanningTemplatesService, type ConceptRoomBreakdownEntry } from '../planning-templates/planning-templates.service';
import {
  type CalculatorDefinitionCreateInput,
  type CalculatorDefinitionUpdateInput,
  type CalculatorMappingUpsertInput,
  type CalculatorPublishInput,
  type CalculatorRunInput,
  type CalculatorSelectionInput,
  type CalculatorVersionCreateInput,
  type EstimateQuotationInput,
} from './calculator.schemas';
import { formulaKeys, runFormula, validateFormulaConfiguration, type FormulaLine } from './formula-registry';

const ESTIMATE_DISCLAIMER = 'This estimate is for preliminary planning. Actual quantities and costs can vary with design, site conditions, workmanship, product coverage and market prices. Confirm final quantities with a qualified contractor, architect or engineer.';

type AvailabilityResponse = {
  pincode: string;
  serviceable: boolean;
  products: Array<{
    productId: string;
    availabilityStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ENQUIRY';
    fulfilmentMode: 'STOCKED' | 'PARTNER_STOCK' | 'ON_REQUEST';
    leadTimeLabel?: string;
  }>;
};

const unavailableInventoryContext = (pincode: string): AvailabilityResponse => ({
  pincode,
  serviceable: false,
  products: [],
});

type ResolvedProduct = {
  product: {
    id: string;
    name: string;
    sellingPrice: Prisma.Decimal;
    gstPercent: Prisma.Decimal | null;
    minimumOrderQuantity: number;
    unit: string;
    brand: { name: string };
    images: Array<{ src: string; alt: string }>;
  };
  variant: {
    id: string;
    sku: string;
    price: Prisma.Decimal | null;
    unit: string;
    minimumOrderQuantity: number;
  } | null;
};

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function money(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round((parsed + Number.EPSILON) * 100) / 100 : 0;
}

function quantity(value: number) {
  return Math.round((value + Number.EPSILON) * 1_000) / 1_000;
}

function publicAvailabilityLabel(serviceable: boolean, product?: AvailabilityResponse['products'][number]) {
  if (!serviceable) return 'Not serviceable for this PIN code';
  if (!product) return 'Request confirmation';
  if (product.availabilityStatus === 'LOW_STOCK') return 'Limited stock';
  if (product.availabilityStatus === 'IN_STOCK' && product.fulfilmentMode === 'PARTNER_STOCK') return 'Available from partner';
  if (product.availabilityStatus === 'IN_STOCK') return 'In stock';
  return 'Request confirmation';
}

@Injectable()
export class CalculatorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryLocations: InventoryLocationsService,
    private readonly quoteRequests: QuoteRequestsService,
    private readonly planningTemplates: PlanningTemplatesService,
  ) {}

  private requireEditor(role: UserRole) {
    const allowed: UserRole[] = [UserRole.ADMIN, UserRole.CATALOG_MANAGER, UserRole.DATA_ENTRY];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Calculator catalogue permission is required.');
    }
  }

  private requirePublisher(role: UserRole) {
    if (role !== UserRole.ADMIN) throw new ForbiddenException('Only administrators can publish calculator versions.');
  }

  private requireEstimateReader(role: UserRole) {
    const allowed: UserRole[] = [UserRole.ADMIN, UserRole.CATALOG_MANAGER, UserRole.SALES, UserRole.SUPPORT];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Estimate access is not permitted for this role.');
    }
  }

  private requireOverviewViewer(role: UserRole) {
    const allowed: UserRole[] = [UserRole.ADMIN, UserRole.CATALOG_MANAGER, UserRole.DATA_ENTRY, UserRole.SALES, UserRole.SUPPORT];
    if (!allowed.includes(role)) throw new ForbiddenException('Calculator access is not permitted for this role.');
  }

  async publicDefinitions(): Promise<unknown> {
    const definitions = await this.prisma.client.calculatorDefinition.findMany({
      where: { status: CalculatorDefinitionStatus.PUBLISHED, versions: { some: { status: CalculatorVersionStatus.PUBLISHED } } },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        description: true,
        instructions: true,
        imageUrl: true,
        icon: true,
        disclaimer: true,
        sortOrder: true,
        versions: {
          where: { status: CalculatorVersionStatus.PUBLISHED },
          orderBy: { version: 'desc' },
          take: 1,
          select: { version: true, effectiveFrom: true, publishedAt: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return definitions.map((definition) => ({ ...definition, currentVersion: definition.versions[0] ?? null, versions: undefined }));
  }

  async publicDefinition(slug: string): Promise<unknown> {
    const definition = await this.prisma.client.calculatorDefinition.findFirst({
      where: { slug, status: CalculatorDefinitionStatus.PUBLISHED },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        description: true,
        instructions: true,
        imageUrl: true,
        icon: true,
        disclaimer: true,
        versions: {
          where: { status: CalculatorVersionStatus.PUBLISHED },
          orderBy: { version: 'desc' },
          take: 1,
          select: { id: true, version: true, effectiveFrom: true, publishedAt: true },
        },
      },
    });
    if (!definition?.versions[0]) throw new NotFoundException('Calculator not found.');
    return { ...definition, currentVersion: definition.versions[0], versions: undefined };
  }

  private async currentVersion(slug: string) {
    const definition = await this.prisma.client.calculatorDefinition.findFirst({
      where: { slug, status: CalculatorDefinitionStatus.PUBLISHED },
      include: {
        versions: {
          where: { status: CalculatorVersionStatus.PUBLISHED },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });
    if (!definition?.versions[0]) throw new NotFoundException('Calculator not found or not published.');
    return { definition, version: definition.versions[0] };
  }

  private async resolveProduct(mapping: { categoryId: string | null; productId: string | null; variantId: string | null }): Promise<ResolvedProduct | null> {
    if (mapping.variantId) {
      const variant = await this.prisma.client.productVariant.findFirst({
        where: { id: mapping.variantId, status: VariantStatus.ACTIVE, product: { status: ProductStatus.PUBLISHED } },
        select: {
          id: true, sku: true, price: true, unit: true, minimumOrderQuantity: true,
          product: { select: { id: true, name: true, sellingPrice: true, gstPercent: true, minimumOrderQuantity: true, unit: true, brand: { select: { name: true } }, images: { orderBy: [{ primary: 'desc' }, { sortOrder: 'asc' }], take: 1, select: { src: true, alt: true } } } },
        },
      });
      return variant ? { product: variant.product, variant: { id: variant.id, sku: variant.sku, price: variant.price, unit: variant.unit, minimumOrderQuantity: variant.minimumOrderQuantity } } : null;
    }
    const product = await this.prisma.client.product.findFirst({
      where: {
        status: ProductStatus.PUBLISHED,
        ...(mapping.productId ? { id: mapping.productId } : {}),
        ...(!mapping.productId && mapping.categoryId ? { categories: { some: { id: mapping.categoryId, published: true } } } : {}),
        variants: { some: { status: VariantStatus.ACTIVE } },
      },
      select: {
        id: true, name: true, sellingPrice: true, gstPercent: true, minimumOrderQuantity: true, unit: true,
        brand: { select: { name: true } },
        images: { orderBy: [{ primary: 'desc' }, { sortOrder: 'asc' }], take: 1, select: { src: true, alt: true } },
        variants: { where: { status: VariantStatus.ACTIVE }, orderBy: { createdAt: 'asc' }, take: 1, select: { id: true, sku: true, price: true, unit: true, minimumOrderQuantity: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (!product) return null;
    const [variant] = product.variants;
    return { product, variant: variant ?? null };
  }

  private async buildEstimateItem(
    formulaLine: FormulaLine,
    versionId: string,
    tier: CalculatorQualityTier,
    availability: AvailabilityResponse,
    sortOrder: number,
  ) {
    const mappings = await this.prisma.client.calculatorProductMapping.findMany({
      where: { calculatorVersionId: versionId, outputKey: formulaLine.outputKey, qualityTier: tier, active: true },
      orderBy: [{ preferred: 'desc' }, { priority: 'asc' }],
    });
    let selectedMapping = null as (typeof mappings)[number] | null;
    let resolved: ResolvedProduct | null = null;
    for (const mapping of mappings) {
      resolved = await this.resolveProduct(mapping);
      if (resolved) {
        selectedMapping = mapping;
        break;
      }
    }
    const packageSize = selectedMapping?.packageSize ? Number(selectedMapping.packageSize) : null;
    const conversionFactor = selectedMapping ? Number(selectedMapping.conversionFactor) : 1;
    const baseQuantity = formulaLine.quantityWithWastage;
    const convertedQuantity = packageSize
      ? Math.ceil(baseQuantity / packageSize) * conversionFactor
      : (['piece', 'bag'].includes(formulaLine.unitCode) ? Math.ceil(baseQuantity) : quantity(baseQuantity * conversionFactor));
    const minimumOrder = resolved?.variant?.minimumOrderQuantity ?? resolved?.product.minimumOrderQuantity ?? 1;
    const purchaseQuantity = Math.max(convertedQuantity, minimumOrder);
    const availabilityEntry = resolved ? availability.products.find((item) => item.productId === resolved?.product.id) : undefined;
    const unitPrice = resolved ? money(resolved.variant?.price ?? resolved.product.sellingPrice) : null;
    const gstPercent = resolved?.product.gstPercent == null ? null : money(resolved.product.gstPercent);
    const lineSubtotal = unitPrice == null ? null : money(purchaseQuantity * unitPrice);
    const gstAmount = lineSubtotal == null || gstPercent == null ? null : money(lineSubtotal * gstPercent / 100);
    const lineTotal = lineSubtotal == null ? null : money(lineSubtotal + (gstAmount ?? 0));
    return {
      outputKey: formulaLine.outputKey,
      description: resolved?.product.name ?? formulaLine.description,
      rawQuantity: formulaLine.rawQuantity,
      wastageQuantity: formulaLine.wastageQuantity,
      purchaseQuantity,
      unitCode: resolved?.variant?.unit ?? selectedMapping?.expectedUnit ?? formulaLine.unitCode,
      packageSize,
      productId: resolved?.product.id,
      variantId: resolved?.variant?.id,
      availabilityLabel: resolved ? publicAvailabilityLabel(availability.serviceable, availabilityEntry) : 'Product selection requires staff confirmation',
      leadTimeLabel: availabilityEntry?.leadTimeLabel ?? (availability.serviceable ? 'Delivery confirmed with quotation' : null),
      unitPrice,
      gstPercent,
      lineSubtotal,
      gstAmount,
      lineTotal,
      mappingSnapshot: json({
        mappingId: selectedMapping?.id ?? null,
        qualityTier: tier,
        group: formulaLine.group,
        formulaOutputUnit: formulaLine.unitCode,
        expectedUnit: selectedMapping?.expectedUnit ?? null,
        packageSize,
        conversionFactor,
        productName: resolved?.product.name ?? null,
        brand: resolved?.product.brand.name ?? null,
        sku: resolved?.variant?.sku ?? null,
        image: resolved?.product.images[0] ?? null,
      }),
      sortOrder,
    };
  }

  // Concept-mode input augmentation: if the caller supplied a `roomBreakdown` and did not already
  // supply explicit `electricalPoints`/`plumbingFixtures`, resolve those arrays from managed
  // RoomTemplates before the pure formula runs. Runs strictly before `runFormula` — symmetric to
  // `buildEstimateItem()`'s DB-dependent product-mapping resolution, which runs strictly after it.
  private async augmentConceptModeInputs(rawInputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    const roomBreakdown = rawInputs.roomBreakdown;
    if (!Array.isArray(roomBreakdown) || roomBreakdown.length === 0) return rawInputs;

    const hasExplicitElectrical = Array.isArray(rawInputs.electricalPoints) && rawInputs.electricalPoints.length > 0;
    const hasExplicitPlumbing = Array.isArray(rawInputs.plumbingFixtures) && rawInputs.plumbingFixtures.length > 0;
    if (hasExplicitElectrical && hasExplicitPlumbing) return rawInputs;

    const knownRoomTypes = new Set<string>(Object.values(RoomType));
    const validRoomBreakdown = (roomBreakdown as Array<{ roomType?: unknown; quantity?: unknown }>).filter(
      (room): room is ConceptRoomBreakdownEntry =>
        typeof room?.roomType === 'string' && knownRoomTypes.has(room.roomType) && typeof room.quantity === 'number' && room.quantity > 0,
    );
    if (validRoomBreakdown.length === 0) return rawInputs;

    const regionalProfileId = typeof rawInputs.regionalProfileId === 'string' ? rawInputs.regionalProfileId : undefined;
    const schedule = await this.planningTemplates.resolveConceptModeSchedule(validRoomBreakdown, regionalProfileId);

    return {
      ...rawInputs,
      electricalPoints: hasExplicitElectrical ? rawInputs.electricalPoints : schedule.electricalPoints,
      plumbingFixtures: hasExplicitPlumbing ? rawInputs.plumbingFixtures : schedule.plumbingFixtures,
    };
  }

  async calculate(slug: string, input: CalculatorRunInput): Promise<unknown> {
    const { definition, version } = await this.currentVersion(slug);
    if (input.sessionReference) {
      const existing = await this.prisma.client.materialEstimate.findUnique({
        where: { calculatorVersionId_sessionReference: { calculatorVersionId: version.id, sessionReference: input.sessionReference } },
        include: this.publicEstimateInclude(),
      });
      if (existing) return this.toPublicEstimate(existing);
    }
    const formulaInputs = await this.augmentConceptModeInputs(input.inputs);
    const result = runFormula(version.formulaKey, formulaInputs, version.configuration);
    // Quantity calculation must not depend on catalogue, pricing, serviceability, or
    // fulfilment data. Inventory enrichment is optional and can be configured later.
    let availability = unavailableInventoryContext(input.deliveryPincode);
    try {
      availability = await this.inventoryLocations.publicAvailability(input.deliveryPincode) as AvailabilityResponse;
    } catch {
      // Keep the versioned material calculation available when inventory context is
      // temporarily unavailable. No availability promise is made in this state.
    }
    const items = await Promise.all(result.lines.map((formulaLine, index) => this.buildEstimateItem(formulaLine, version.id, input.qualityTier, availability, index)));
    const pricedItems = items.filter((item) => item.lineTotal != null);
    const subtotal = pricedItems.length === items.length ? money(items.reduce((sum, item) => sum + (item.lineSubtotal ?? 0), 0)) : null;
    const gstTotal = pricedItems.length === items.length ? money(items.reduce((sum, item) => sum + (item.gstAmount ?? 0), 0)) : null;
    const valueHigh = pricedItems.length === items.length ? money(items.reduce((sum, item) => sum + (item.lineTotal ?? 0), 0)) : null;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1_000);
    const reference = `EST-${now.toISOString().slice(2, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const estimate = await this.prisma.client.materialEstimate.create({
      data: {
        reference,
        definitionId: definition.id,
        calculatorVersionId: version.id,
        sessionReference: input.sessionReference,
        deliveryPincode: input.deliveryPincode,
        qualityTier: input.qualityTier,
        inputs: json(result.normalizedInputs),
        results: json(result.lines),
        assumptions: json(result.assumptions),
        subtotal,
        gstTotal,
        valueLow: valueHigh,
        valueHigh,
        priceValidUntil: expiresAt,
        expiresAt,
        items: { create: items },
      },
      include: this.publicEstimateInclude(),
    });
    return this.toPublicEstimate(estimate);
  }

  private publicEstimateInclude() {
    return {
      definition: { select: { name: true, slug: true, type: true, disclaimer: true } },
      calculatorVersion: { select: { version: true, publishedAt: true } },
      items: {
        orderBy: { sortOrder: 'asc' as const },
        include: {
          product: { select: { id: true, name: true, brand: { select: { name: true } }, images: { orderBy: [{ primary: 'desc' as const }, { sortOrder: 'asc' as const }], take: 1, select: { src: true, alt: true } } } },
          variant: { select: { id: true, sku: true, unit: true, attributes: true } },
        },
      },
      quotation: { select: { reference: true } },
    };
  }

  private toPublicEstimate(estimate: any) {
    return {
      reference: estimate.reference,
      calculator: { name: estimate.definition.name, slug: estimate.definition.slug },
      version: estimate.calculatorVersion.version,
      deliveryPincode: estimate.deliveryPincode,
      qualityTier: estimate.qualityTier,
      inputs: estimate.inputs,
      results: estimate.results,
      assumptions: estimate.assumptions,
      subtotal: estimate.subtotal,
      gstTotal: estimate.gstTotal,
      deliveryTotal: estimate.deliveryTotal,
      indicativeTotal: estimate.valueHigh,
      priceValidUntil: estimate.priceValidUntil,
      expiresAt: estimate.expiresAt,
      expired: estimate.expiresAt.getTime() <= Date.now(),
      status: estimate.status,
      quotationReference: estimate.quotation?.reference ?? null,
      disclaimer: estimate.definition.disclaimer || ESTIMATE_DISCLAIMER,
      items: estimate.items.map((item: any) => ({
        id: item.id,
        outputKey: item.outputKey,
        description: item.description,
        rawQuantity: item.rawQuantity,
        wastageQuantity: item.wastageQuantity,
        purchaseQuantity: item.purchaseQuantity,
        group: typeof item.mappingSnapshot?.group === 'string' ? item.mappingSnapshot.group : 'Material requirement',
        formulaUnitCode: typeof item.mappingSnapshot?.formulaOutputUnit === 'string' ? item.mappingSnapshot.formulaOutputUnit : item.unitCode,
        unitCode: item.unitCode,
        packageSize: item.packageSize,
        availabilityLabel: item.availabilityLabel,
        leadTimeLabel: item.leadTimeLabel,
        unitPrice: item.unitPrice,
        gstPercent: item.gstPercent,
        lineTotal: item.lineTotal,
        product: item.product ? { id: item.product.id, name: item.product.name, brand: item.product.brand.name, image: item.product.images[0] ?? null } : null,
        variant: item.variant ? { id: item.variant.id, sku: item.variant.sku, unit: item.variant.unit, attributes: item.variant.attributes } : null,
      })),
    };
  }

  async publicEstimate(reference: string): Promise<unknown> {
    const estimate = await this.prisma.client.materialEstimate.findUnique({ where: { reference }, include: this.publicEstimateInclude() });
    if (!estimate) throw new NotFoundException('Estimate not found.');
    return this.toPublicEstimate(estimate);
  }

  async updateSelection(reference: string, input: CalculatorSelectionInput): Promise<unknown> {
    const estimate = await this.prisma.client.materialEstimate.findUnique({ where: { reference }, include: { items: true } });
    if (!estimate) throw new NotFoundException('Estimate not found.');
    if (estimate.expiresAt.getTime() <= Date.now() || estimate.status !== MaterialEstimateStatus.ACTIVE) throw new ConflictException('This estimate can no longer be changed.');
    const itemMap = new Map(estimate.items.map((item) => [item.id, item]));
    const availability = await this.inventoryLocations.publicAvailability(estimate.deliveryPincode) as AvailabilityResponse;
    for (const selection of input.items) {
      const item = itemMap.get(selection.estimateItemId);
      if (!item) throw new BadRequestException('An estimate item does not belong to this estimate.');
      const variant = await this.prisma.client.productVariant.findFirst({
        where: { id: selection.variantId, productId: selection.productId, status: VariantStatus.ACTIVE, product: { status: ProductStatus.PUBLISHED } },
        include: { product: true },
      });
      if (!variant) throw new BadRequestException('Choose an active published product variant.');
      const allowed = await this.prisma.client.calculatorProductMapping.findFirst({
        where: {
          calculatorVersionId: estimate.calculatorVersionId,
          outputKey: item.outputKey,
          qualityTier: estimate.qualityTier,
          active: true,
          OR: [
            { variantId: variant.id },
            { productId: variant.productId },
            { categoryId: { in: (await this.prisma.client.product.findUnique({ where: { id: variant.productId }, select: { categories: { select: { id: true } } } }))?.categories.map((category) => category.id) ?? [] } },
          ],
        },
      });
      if (!allowed) throw new BadRequestException('This product is not approved for the calculated material line.');
      const availabilityEntry = availability.products.find((entry) => entry.productId === variant.productId);
      const unitPrice = money(variant.price ?? variant.product.sellingPrice);
      const lineSubtotal = money(Number(item.purchaseQuantity) * unitPrice);
      const gstPercent = variant.product.gstPercent == null ? null : money(variant.product.gstPercent);
      const gstAmount = gstPercent == null ? null : money(lineSubtotal * gstPercent / 100);
      await this.prisma.client.materialEstimateItem.update({
        where: { id: item.id },
        data: {
          productId: variant.productId,
          variantId: variant.id,
          description: variant.product.name,
          unitCode: variant.unit,
          availabilityLabel: publicAvailabilityLabel(availability.serviceable, availabilityEntry),
          leadTimeLabel: availabilityEntry?.leadTimeLabel,
          unitPrice,
          gstPercent,
          lineSubtotal,
          gstAmount,
          lineTotal: money(lineSubtotal + (gstAmount ?? 0)),
          mappingSnapshot: json({ mappingId: allowed.id, qualityTier: estimate.qualityTier, productName: variant.product.name, sku: variant.sku }),
        },
      });
    }
    await this.recalculateEstimateTotals(estimate.id);
    return this.publicEstimate(reference);
  }

  private async recalculateEstimateTotals(estimateId: string) {
    const items = await this.prisma.client.materialEstimateItem.findMany({ where: { estimateId } });
    const allPriced = items.every((item) => item.lineTotal != null);
    const subtotal = allPriced ? money(items.reduce((sum, item) => sum + Number(item.lineSubtotal), 0)) : null;
    const gstTotal = allPriced ? money(items.reduce((sum, item) => sum + Number(item.gstAmount), 0)) : null;
    const total = allPriced ? money(items.reduce((sum, item) => sum + Number(item.lineTotal), 0)) : null;
    await this.prisma.client.materialEstimate.update({ where: { id: estimateId }, data: { subtotal, gstTotal, valueLow: total, valueHigh: total } });
  }

  async addToQuotation(reference: string, input: EstimateQuotationInput): Promise<unknown> {
    const estimate = await this.prisma.client.materialEstimate.findUnique({ where: { reference }, include: { items: true, quotation: true } });
    if (!estimate) throw new NotFoundException('Estimate not found.');
    if (estimate.quotation) return { reference: estimate.quotation.reference, itemCount: estimate.items.length, existing: true };
    if (estimate.expiresAt.getTime() <= Date.now()) throw new ConflictException('This estimate has expired. Run the calculator again for current products and prices.');
    return this.quoteRequests.create({
      ...input,
      deliveryPincode: estimate.deliveryPincode,
      sourceEstimateReference: estimate.reference,
      items: estimate.items.map((item) => ({
        productId: item.productId ?? undefined,
        variantId: item.variantId ?? undefined,
        description: item.description,
        quantity: Number(item.purchaseQuantity),
        unitCode: item.unitCode,
        notes: `Calculated by ${estimate.reference}`,
      })),
    });
  }

  async adminOverview(role: UserRole): Promise<unknown> {
    this.requireOverviewViewer(role);
    const definitions = await this.prisma.client.calculatorDefinition.findMany({
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: {
            mappings: {
              orderBy: [{ outputKey: 'asc' }, { qualityTier: 'asc' }, { priority: 'asc' }],
              include: {
                category: { select: { id: true, name: true } },
                product: { select: { id: true, name: true, status: true } },
                variant: { select: { id: true, sku: true, unit: true, status: true } },
              },
            },
            _count: { select: { mappings: true, estimates: true } },
          },
        },
        _count: { select: { estimates: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const [products, categories] = await Promise.all([
      this.prisma.client.product.findMany({
        where: { status: { in: [ProductStatus.PUBLISHED, ProductStatus.DRAFT] } },
        select: {
          id: true,
          name: true,
          status: true,
          unit: true,
          variants: {
            where: { status: VariantStatus.ACTIVE },
            select: { id: true, sku: true, unit: true, price: true, status: true },
            orderBy: { sku: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.category.findMany({
        where: { published: true },
        select: { id: true, name: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);
    return { formulaKeys: formulaKeys(), definitions, products, categories };
  }

  async createDefinition(input: CalculatorDefinitionCreateInput, actorId: string, role: UserRole): Promise<unknown> {
    this.requireEditor(role);
    const definition = await this.prisma.client.calculatorDefinition.create({ data: input });
    await this.prisma.client.calculatorAuditEvent.create({ data: { definitionId: definition.id, action: 'DEFINITION_CREATED', actorId, after: json(definition) } });
    return definition;
  }

  async updateDefinition(id: string, input: CalculatorDefinitionUpdateInput, actorId: string, role: UserRole): Promise<unknown> {
    this.requireEditor(role);
    const before = await this.prisma.client.calculatorDefinition.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Calculator definition not found.');
    const after = await this.prisma.client.calculatorDefinition.update({ where: { id }, data: input });
    await this.prisma.client.calculatorAuditEvent.create({ data: { definitionId: id, action: 'DEFINITION_UPDATED', actorId, before: json(before), after: json(after) } });
    return after;
  }

  async createVersion(definitionId: string, input: CalculatorVersionCreateInput, actorId: string, role: UserRole): Promise<unknown> {
    this.requireEditor(role);
    validateFormulaConfiguration(input.formulaKey, input.configuration);
    const definition = await this.prisma.client.calculatorDefinition.findUnique({ where: { id: definitionId } });
    if (!definition) throw new NotFoundException('Calculator definition not found.');
    return this.prisma.client.$transaction(async (tx) => {
      const latest = await tx.calculatorVersion.aggregate({ where: { definitionId }, _max: { version: true } });
      const version = await tx.calculatorVersion.create({ data: { definitionId, version: (latest._max.version ?? 0) + 1, formulaKey: input.formulaKey, configuration: json(input.configuration), effectiveFrom: input.effectiveFrom, createdById: actorId } });
      await tx.calculatorAuditEvent.create({ data: { definitionId, versionId: version.id, action: 'VERSION_CREATED', reason: input.reason, actorId, after: json(version) } });
      return version;
    });
  }

  async upsertMapping(versionId: string, input: CalculatorMappingUpsertInput, actorId: string, role: UserRole): Promise<unknown> {
    this.requireEditor(role);
    const version = await this.prisma.client.calculatorVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException('Calculator version not found.');
    if (version.status !== CalculatorVersionStatus.DRAFT) throw new ConflictException('Published calculator mappings are immutable. Create a new draft version.');
    if (input.variantId) {
      const variant = await this.prisma.client.productVariant.findUnique({ where: { id: input.variantId } });
      if (!variant || (input.productId && input.productId !== variant.productId)) throw new BadRequestException('The selected variant and product do not match.');
    }
    const mapping = await this.prisma.client.calculatorProductMapping.upsert({
      where: { calculatorVersionId_outputKey_qualityTier_priority: { calculatorVersionId: versionId, outputKey: input.outputKey, qualityTier: input.qualityTier, priority: input.priority } },
      create: { calculatorVersionId: versionId, ...input },
      update: input,
    });
    await this.prisma.client.calculatorAuditEvent.create({ data: { definitionId: version.definitionId, versionId, action: 'MAPPING_UPSERTED', actorId, after: json(mapping) } });
    return mapping;
  }

  async publishVersion(versionId: string, input: CalculatorPublishInput, actorId: string, role: UserRole): Promise<unknown> {
    this.requirePublisher(role);
    const version = await this.prisma.client.calculatorVersion.findUnique({ where: { id: versionId }, include: { mappings: true } });
    if (!version) throw new NotFoundException('Calculator version not found.');
    if (version.status !== CalculatorVersionStatus.DRAFT) throw new ConflictException('Only a draft version can be published.');
    validateFormulaConfiguration(version.formulaKey, version.configuration);
    const now = new Date();
    return this.prisma.client.$transaction(async (tx) => {
      await tx.calculatorVersion.updateMany({ where: { definitionId: version.definitionId, status: CalculatorVersionStatus.PUBLISHED }, data: { status: CalculatorVersionStatus.RETIRED } });
      const published = await tx.calculatorVersion.update({ where: { id: versionId }, data: { status: CalculatorVersionStatus.PUBLISHED, publishedAt: now, effectiveFrom: version.effectiveFrom ?? now, publishedById: actorId } });
      await tx.calculatorDefinition.update({ where: { id: version.definitionId }, data: { status: CalculatorDefinitionStatus.PUBLISHED } });
      await tx.calculatorAuditEvent.create({ data: { definitionId: version.definitionId, versionId, action: 'VERSION_PUBLISHED', reason: input.reason, actorId, after: json(published) } });
      return published;
    });
  }

  async adminEstimates(role: UserRole): Promise<unknown> {
    this.requireEstimateReader(role);
    return this.prisma.client.materialEstimate.findMany({
      include: {
        definition: { select: { name: true, slug: true } },
        calculatorVersion: { select: { version: true } },
        quotation: { select: { id: true, reference: true, status: true } },
        items: { select: { id: true, description: true, purchaseQuantity: true, unitCode: true, lineTotal: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
