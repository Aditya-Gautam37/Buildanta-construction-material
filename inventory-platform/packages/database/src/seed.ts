import "dotenv/config"
import {
  FulfilmentMode,
  FulfilmentLocationType,
  InventoryLedgerType,
  InventoryReservationStatus,
  PaymentStatus,
  PrismaClient,
  ProductStatus,
  ProfessionalType,
  QuotationApprovalStatus,
  QuotationStatus,
  SalesOrderStatus,
  VariantStatus,
} from "./../generated/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { seedPhase3Operations } from "./seed-phase3"

async function main() {
  if (process.env.ALLOW_DEMO_SEED !== "I_UNDERSTAND") {
    throw new Error(
      "Demo seeding is disabled for the real-data workspace. Set ALLOW_DEMO_SEED=I_UNDERSTAND only in a disposable development database.",
    )
  }
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  const storefrontUrl = (
    process.env.STOREFRONT_URL ?? "http://localhost:3003"
  ).replace(/\/$/, "")

  try {
    const category = await prisma.category.upsert({
      where: { slug: "flooring" },
      update: { name: "Flooring" },
      create: { name: "Flooring", slug: "flooring" },
    })
    const stage = await prisma.stage.upsert({
      where: { slug: "finishing" },
      update: { name: "Finishing" },
      create: { name: "Finishing", slug: "finishing" },
    })
    const room = await prisma.room.upsert({
      where: { slug: "living-room" },
      update: { name: "Living room" },
      create: { name: "Living room", slug: "living-room" },
    })
    const brand = await prisma.brand.upsert({
      where: { slug: "buildanta-select" },
      update: { name: "Buildanta Select" },
      create: {
        name: "Buildanta Select",
        slug: "buildanta-select",
        description: "Sample development catalog brand.",
      },
    })
    const supplier = await prisma.supplier.upsert({
      where: { email: "catalog@example.invalid" },
      update: { name: "Sample supplier" },
      create: {
        name: "Sample supplier",
        email: "catalog@example.invalid",
        contactInfo: "Development seed data",
      },
    })
    const existing = await prisma.productVariant.findUnique({
      where: { sku: "BLD-SAMPLE-001" },
      select: { productId: true },
    })
    if (!existing) {
      await prisma.product.create({
        data: {
          name: "Sample porcelain tile",
          description:
            "Safe development data. Replace or remove before production.",
          keySpecifications: ["600 x 600 mm", "Matte finish"],
          brandId: brand.id,
          sellingPrice: 1299,
          categories: { connect: { id: category.id } },
          stages: { connect: { id: stage.id } },
          rooms: { connect: { id: room.id } },
          variants: {
            create: {
              supplierId: supplier.id,
              sku: "BLD-SAMPLE-001",
              price: 1299,
              attributes: { size: "600 x 600 mm", finish: "matte" },
            },
          },
        },
      })
    }

    const professionalCategorySlug: Record<ProfessionalType, string> = {
      CONTRACTOR: "contractors",
      INTERIOR_DESIGNER: "interior-designers",
      BUILDER: "builders",
      ARCHITECT: "architects",
      PRODUCT_OWNER: "product-owners",
    }
    const demoProfessionals = [
      {
        name: "Arjun Mehta",
        slug: "arjun-mehta",
        type: ProfessionalType.CONTRACTOR,
        headline: "Residential execution and renovation planning",
        bio: "A fictional Buildanta demonstration profile representing an execution-focused contractor for residential construction, renovation planning and site coordination.",
        photoUrl: `${storefrontUrl}/professionals/arjun-mehta.png`,
        location: "Noida, Uttar Pradesh",
        yearsExperience: 12,
        email: "arjun.mehta@example.invalid",
        phone: "+91 90000 01001",
        services: [
          "Turnkey civil execution",
          "Renovation planning",
          "Site coordination",
          "Material estimation",
        ],
        featured: true,
        sortOrder: 10,
      },
      {
        name: "Naina Kapoor",
        slug: "naina-kapoor",
        type: ProfessionalType.INTERIOR_DESIGNER,
        headline: "Practical, material-led interiors for modern homes",
        bio: "A fictional Buildanta demonstration profile representing an interior designer focused on functional layouts, finish selection and practical residential styling.",
        photoUrl: `${storefrontUrl}/professionals/naina-kapoor.png`,
        location: "Gurugram, Haryana",
        yearsExperience: 8,
        email: "naina.kapoor@example.invalid",
        phone: "+91 90000 01002",
        services: [
          "Space planning",
          "Kitchen and wardrobe design",
          "Material palettes",
          "Lighting coordination",
        ],
        featured: true,
        sortOrder: 20,
      },
      {
        name: "Vikram Suri",
        slug: "vikram-suri",
        type: ProfessionalType.BUILDER,
        headline: "Residential project planning and delivery",
        bio: "A fictional Buildanta demonstration profile representing a residential builder experienced in planning, procurement coordination and quality-led project delivery.",
        photoUrl: `${storefrontUrl}/professionals/vikram-suri.png`,
        location: "New Delhi, Delhi",
        yearsExperience: 17,
        email: "vikram.suri@example.invalid",
        phone: "+91 90000 01003",
        services: [
          "Residential development",
          "Procurement planning",
          "Quality coordination",
          "Project scheduling",
        ],
        featured: false,
        sortOrder: 30,
      },
      {
        name: "Meera Iyer",
        slug: "meera-iyer",
        type: ProfessionalType.ARCHITECT,
        headline: "Climate-aware homes with clear build documentation",
        bio: "A fictional Buildanta demonstration profile representing an architect focused on efficient residential planning, climate-aware design and construction documentation.",
        photoUrl: `${storefrontUrl}/professionals/meera-iyer.png`,
        location: "Bengaluru, Karnataka",
        yearsExperience: 11,
        email: "meera.iyer@example.invalid",
        phone: "+91 90000 01004",
        services: [
          "Residential architecture",
          "Planning drawings",
          "Material specifications",
          "Design coordination",
        ],
        featured: true,
        sortOrder: 40,
      },
      {
        name: "Rohan Deshpande",
        slug: "rohan-deshpande",
        type: ProfessionalType.PRODUCT_OWNER,
        headline: "Surface and finish selection for project teams",
        bio: "A fictional Buildanta demonstration profile representing a construction-material specialist who helps project teams compare surfaces, finishes and supply options.",
        photoUrl: `${storefrontUrl}/professionals/rohan-deshpande.png`,
        location: "Pune, Maharashtra",
        yearsExperience: 9,
        email: "rohan.deshpande@example.invalid",
        phone: "+91 90000 01005",
        services: [
          "Material comparison",
          "Finish specification",
          "Supplier coordination",
          "Sample planning",
        ],
        featured: false,
        sortOrder: 50,
      },
    ]

    for (const professional of demoProfessionals) {
      await prisma.professional.upsert({
        where: { slug: professional.slug },
        update: {
          ...professional,
          portfolioUrl: `${storefrontUrl}/professionals/${professionalCategorySlug[professional.type]}/${professional.slug}#selected-work`,
          published: true,
        },
        create: {
          ...professional,
          portfolioUrl: `${storefrontUrl}/professionals/${professionalCategorySlug[professional.type]}/${professional.slug}#selected-work`,
          published: true,
        },
      })
    }

    // Phase 1 location-aware inventory demonstration data. Every label and reference
    // is explicitly marked DEMO and every operation is safe to rerun.
    const demoVariant = await prisma.productVariant.findUnique({
      where: { sku: "BLD-SAMPLE-001" },
    })
    if (demoVariant) {
      await prisma.product.update({
        where: { id: demoVariant.productId },
        data: { status: ProductStatus.PUBLISHED, publishedAt: new Date() },
      })
      const demoWarehouse = await prisma.warehouse.upsert({
        where: { code: "DEMO-KANPUR-EAST" },
        update: { name: "DEMO Kanpur East Yard", active: true },
        create: {
          code: "DEMO-KANPUR-EAST",
          name: "DEMO Kanpur East Yard",
          address: "Demonstration data - not a real fulfilment address",
          city: "Kanpur",
          state: "Uttar Pradesh",
          pincode: "208010",
        },
      })
      const demoBin = await prisma.warehouseLocation.upsert({
        where: {
          warehouseId_code: {
            warehouseId: demoWarehouse.id,
            code: "DEMO-MAIN",
          },
        },
        update: { name: "DEMO Main Storage", active: true },
        create: {
          warehouseId: demoWarehouse.id,
          code: "DEMO-MAIN",
          name: "DEMO Main Storage",
          zone: "DEMO",
        },
      })
      const demoLocation = await prisma.fulfilmentLocation.upsert({
        where: { code: "DEMO-KANPUR-EAST" },
        update: {
          name: "DEMO Kanpur East Yard",
          mode: FulfilmentMode.STOCKED,
          active: true,
        },
        create: {
          code: "DEMO-KANPUR-EAST",
          name: "DEMO Kanpur East Yard",
          type: FulfilmentLocationType.WAREHOUSE,
          mode: FulfilmentMode.STOCKED,
          warehouseId: demoWarehouse.id,
        },
      })
      const demoSouthWarehouse = await prisma.warehouse.upsert({
        where: { code: "DEMO-KANPUR-SOUTH" },
        update: { name: "DEMO Kanpur South Yard", active: true },
        create: {
          code: "DEMO-KANPUR-SOUTH",
          name: "DEMO Kanpur South Yard",
          address: "Demonstration data - not a real fulfilment address",
          city: "Kanpur",
          state: "Uttar Pradesh",
          pincode: "208011",
        },
      })
      const demoSouthBin = await prisma.warehouseLocation.upsert({
        where: {
          warehouseId_code: {
            warehouseId: demoSouthWarehouse.id,
            code: "DEMO-MAIN",
          },
        },
        update: { name: "DEMO Main Storage", active: true },
        create: {
          warehouseId: demoSouthWarehouse.id,
          code: "DEMO-MAIN",
          name: "DEMO Main Storage",
          zone: "DEMO",
        },
      })
      const demoSouthLocation = await prisma.fulfilmentLocation.upsert({
        where: { code: "DEMO-KANPUR-SOUTH" },
        update: {
          name: "DEMO Kanpur South Yard",
          mode: FulfilmentMode.STOCKED,
          active: true,
        },
        create: {
          code: "DEMO-KANPUR-SOUTH",
          name: "DEMO Kanpur South Yard",
          type: FulfilmentLocationType.WAREHOUSE,
          mode: FulfilmentMode.STOCKED,
          warehouseId: demoSouthWarehouse.id,
        },
      })
      const demoArea = await prisma.serviceArea.upsert({
        where: { code: "DEMO-KANPUR" },
        update: { name: "DEMO Kanpur Service Area", active: true },
        create: {
          code: "DEMO-KANPUR",
          name: "DEMO Kanpur Service Area",
          city: "Kanpur",
          state: "Uttar Pradesh",
        },
      })
      await prisma.pincodeCoverage.createMany({
        data: ["208001", "208002", "208010"].map((pincode) => ({
          serviceAreaId: demoArea.id,
          pincode,
        })),
        skipDuplicates: true,
      })
      await prisma.fulfilmentServiceArea.upsert({
        where: {
          fulfilmentLocationId_serviceAreaId: {
            fulfilmentLocationId: demoLocation.id,
            serviceAreaId: demoArea.id,
          },
        },
        update: { estimatedLeadDays: 2, active: true },
        create: {
          fulfilmentLocationId: demoLocation.id,
          serviceAreaId: demoArea.id,
          estimatedLeadDays: 2,
        },
      })
      await prisma.fulfilmentServiceArea.upsert({
        where: {
          fulfilmentLocationId_serviceAreaId: {
            fulfilmentLocationId: demoSouthLocation.id,
            serviceAreaId: demoArea.id,
          },
        },
        update: { estimatedLeadDays: 3, active: true },
        create: {
          fulfilmentLocationId: demoSouthLocation.id,
          serviceAreaId: demoArea.id,
          estimatedLeadDays: 3,
        },
      })
      await prisma.inventoryBalance.upsert({
        where: {
          variantId_fulfilmentLocationId: {
            variantId: demoVariant.id,
            fulfilmentLocationId: demoLocation.id,
          },
        },
        // Preserve reservedQuantity on reruns. Reservations are business records and
        // must only be changed by reservation/release transactions.
        update: { lowStockThreshold: 15, warehouseLocationId: demoBin.id },
        create: {
          variantId: demoVariant.id,
          fulfilmentLocationId: demoLocation.id,
          warehouseLocationId: demoBin.id,
          physicalQuantity: 80,
          reservedQuantity: 10,
          blockedQuantity: 5,
          damagedQuantity: 2,
          quarantineQuantity: 3,
          lowStockThreshold: 15,
        },
      })
      await prisma.inventoryReservation.upsert({
        where: { reference: "DEMO-RES-OPENING-001" },
        update: { notes: "DEMO opening reservation - safe development data." },
        create: {
          reference: "DEMO-RES-OPENING-001",
          variantId: demoVariant.id,
          fulfilmentLocationId: demoLocation.id,
          quantity: 10,
          status: InventoryReservationStatus.ACTIVE,
          expiresAt: new Date("2099-12-31T23:59:59.000Z"),
          notes: "DEMO opening reservation - safe development data.",
        },
      })
      await prisma.inventoryBalance.upsert({
        where: {
          variantId_fulfilmentLocationId: {
            variantId: demoVariant.id,
            fulfilmentLocationId: demoSouthLocation.id,
          },
        },
        update: { lowStockThreshold: 8, warehouseLocationId: demoSouthBin.id },
        create: {
          variantId: demoVariant.id,
          fulfilmentLocationId: demoSouthLocation.id,
          warehouseLocationId: demoSouthBin.id,
          physicalQuantity: 24,
          lowStockThreshold: 8,
        },
      })
      const demoStages = await prisma.stage.findMany({
        where: {
          products: {
            some: {
              status: ProductStatus.PUBLISHED,
              variants: { some: { status: VariantStatus.ACTIVE } },
            },
          },
        },
        select: {
          products: {
            where: {
              status: ProductStatus.PUBLISHED,
              variants: { some: { status: VariantStatus.ACTIVE } },
            },
            select: {
              variants: {
                where: { status: VariantStatus.ACTIVE },
                select: { id: true, lowStockThreshold: true },
                take: 1,
              },
            },
            take: 1,
          },
        },
        take: 15,
      })
      const demoCatalogueVariants = [
        ...new Map(
          demoStages
            .flatMap((stage) =>
              stage.products.flatMap((product) => product.variants)
            )
            .map((variant) => [variant.id, variant])
        ).values(),
      ]
      for (const [index, variant] of demoCatalogueVariants.entries()) {
        await prisma.inventoryBalance.upsert({
          where: {
            variantId_fulfilmentLocationId: {
              variantId: variant.id,
              fulfilmentLocationId: demoLocation.id,
            },
          },
          update: { warehouseLocationId: demoBin.id },
          create: {
            variantId: variant.id,
            fulfilmentLocationId: demoLocation.id,
            warehouseLocationId: demoBin.id,
            physicalQuantity: index % 4 === 0 ? 7 : 30 + index * 3,
            lowStockThreshold:
              index % 4 === 0 ? 10 : Math.max(3, variant.lowStockThreshold),
          },
        })
        const catalogueSupplierProduct = await prisma.supplierProduct.upsert({
          where: {
            supplierId_variantId: {
              supplierId: supplier.id,
              variantId: variant.id,
            },
          },
          update: { active: true },
          create: {
            supplierId: supplier.id,
            variantId: variant.id,
            supplierSku: `DEMO-CATALOG-${index + 1}`,
            fulfilmentMode:
              index % 3 === 0
                ? FulfilmentMode.ON_REQUEST
                : FulfilmentMode.STOCKED,
          },
        })
        await prisma.supplierLeadTime.upsert({
          where: { id: `demo_catalogue_lead_${index + 1}` },
          update: {
            serviceAreaId: demoArea.id,
            minimumDays: 2,
            maximumDays: 5,
          },
          create: {
            id: `demo_catalogue_lead_${index + 1}`,
            supplierProductId: catalogueSupplierProduct.id,
            serviceAreaId: demoArea.id,
            minimumDays: 2,
            maximumDays: 5,
          },
        })
      }
      const supplierProduct = await prisma.supplierProduct.upsert({
        where: {
          supplierId_variantId: {
            supplierId: supplier.id,
            variantId: demoVariant.id,
          },
        },
        update: {
          supplierSku: "DEMO-SUP-TILE-001",
          fulfilmentMode: FulfilmentMode.ON_REQUEST,
          active: true,
        },
        create: {
          supplierId: supplier.id,
          variantId: demoVariant.id,
          supplierSku: "DEMO-SUP-TILE-001",
          fulfilmentMode: FulfilmentMode.ON_REQUEST,
        },
      })
      await prisma.supplierPrice.upsert({
        where: { id: "demo_supplier_price_tile" },
        update: {
          price: 980,
          minimumQuantity: 10,
          validFrom: new Date("2026-08-01T00:00:00.000Z"),
        },
        create: {
          id: "demo_supplier_price_tile",
          supplierProductId: supplierProduct.id,
          price: 980,
          minimumQuantity: 10,
          validFrom: new Date("2026-08-01T00:00:00.000Z"),
        },
      })
      await prisma.supplierLeadTime.upsert({
        where: { id: "demo_supplier_lead_tile" },
        update: { minimumDays: 2, maximumDays: 5, serviceAreaId: demoArea.id },
        create: {
          id: "demo_supplier_lead_tile",
          supplierProductId: supplierProduct.id,
          serviceAreaId: demoArea.id,
          minimumDays: 2,
          maximumDays: 5,
        },
      })
      const dealer = await prisma.dealer.upsert({
        where: { code: "DEMO-DEALER-KANPUR" },
        update: { name: "DEMO Kanpur Material Partner", active: true },
        create: {
          code: "DEMO-DEALER-KANPUR",
          name: "DEMO Kanpur Material Partner",
          city: "Kanpur",
          state: "Uttar Pradesh",
          pincode: "208001",
          address: "Demonstration partner - not a real business",
        },
      })
      await prisma.fulfilmentLocation.upsert({
        where: { code: "DEMO-DEALER-KANPUR" },
        update: { name: dealer.name, active: true },
        create: {
          code: dealer.code,
          name: dealer.name,
          type: FulfilmentLocationType.DEALER_PARTNER,
          mode: FulfilmentMode.PARTNER_STOCK,
          dealerId: dealer.id,
        },
      })
      await prisma.dealerProduct.upsert({
        where: {
          dealerId_variantId: {
            dealerId: dealer.id,
            variantId: demoVariant.id,
          },
        },
        update: {
          price: 1240,
          reportedQuantity: 40,
          confirmedAt: new Date(),
          leadTimeDays: 2,
          active: true,
        },
        create: {
          dealerId: dealer.id,
          variantId: demoVariant.id,
          price: 1240,
          reportedQuantity: 40,
          confirmedAt: new Date(),
          leadTimeDays: 2,
        },
      })
      for (const [index, variant] of demoCatalogueVariants.entries()) {
        if (index % 3 !== 1) continue
        await prisma.dealerProduct.upsert({
          where: {
            dealerId_variantId: { dealerId: dealer.id, variantId: variant.id },
          },
          update: { active: true, leadTimeDays: 3 },
          create: {
            dealerId: dealer.id,
            variantId: variant.id,
            reportedQuantity: 12 + index,
            confirmedAt: new Date(),
            leadTimeDays: 3,
          },
        })
      }
      await prisma.dealerServiceArea.upsert({
        where: {
          dealerId_serviceAreaId: {
            dealerId: dealer.id,
            serviceAreaId: demoArea.id,
          },
        },
        update: { estimatedLeadDays: 2, active: true },
        create: {
          dealerId: dealer.id,
          serviceAreaId: demoArea.id,
          estimatedLeadDays: 2,
        },
      })
      const carrier = await prisma.carrier.upsert({
        where: { code: "DEMO-CARRIER-KANPUR" },
        update: { name: "DEMO Kanpur Transport", active: true },
        create: {
          code: "DEMO-CARRIER-KANPUR",
          name: "DEMO Kanpur Transport",
          phone: "+91 90000 02001",
        },
      })
      await prisma.carrierServiceArea.upsert({
        where: {
          carrierId_serviceAreaId: {
            carrierId: carrier.id,
            serviceAreaId: demoArea.id,
          },
        },
        update: { baseCharge: 750, perKmCharge: 22, active: true },
        create: {
          carrierId: carrier.id,
          serviceAreaId: demoArea.id,
          baseCharge: 750,
          perKmCharge: 22,
        },
      })
      await prisma.stockTransfer.upsert({
        where: { reference: "DEMO-TRANSFER-001" },
        update: {
          originLocationId: demoLocation.id,
          destinationLocationId: demoSouthLocation.id,
          notes: "DEMO draft transfer - safe to modify",
          status: "DRAFT",
        },
        create: {
          reference: "DEMO-TRANSFER-001",
          originLocationId: demoLocation.id,
          destinationLocationId: demoSouthLocation.id,
          notes: "DEMO draft transfer - not dispatched",
          items: { create: { variantId: demoVariant.id, quantity: 5 } },
        },
      })
      await prisma.stockCount.upsert({
        where: { reference: "DEMO-COUNT-001" },
        update: { notes: "DEMO stock count - not approved", status: "DRAFT" },
        create: {
          reference: "DEMO-COUNT-001",
          fulfilmentLocationId: demoLocation.id,
          notes: "DEMO stock count - not approved",
          items: {
            create: {
              variantId: demoVariant.id,
              expectedQuantity: 80,
              countedQuantity: 79,
            },
          },
        },
      })

      // Phase 2 quotation and sales-order demonstration data. These records use
      // deterministic references and are created once, so rerunning the seed does
      // not duplicate orders, reservations, ledger entries, or stock movements.
      const demoProduct = await prisma.product.findUnique({
        where: { id: demoVariant.productId },
      })
      if (demoProduct) {
        const demoValidUntil = new Date("2099-12-31T23:59:59.000Z")
        const ensureDemoQuotation = async (
          reference: string,
          status: QuotationStatus,
          approvalStatus?: QuotationApprovalStatus
        ) => {
          const existingQuotation = await prisma.quotation.findUnique({
            where: { reference },
            include: {
              items: true,
              revisions: { include: { items: true, approvals: true } },
            },
          })
          if (existingQuotation) return existingQuotation

          const quotation = await prisma.quotation.create({
            data: {
              reference,
              customerName: "DEMO Kanpur Project Customer",
              customerEmail: "phase2.customer@example.invalid",
              customerPhone: "+91 90000 03001",
              company: "DEMO Build Project",
              deliveryPincode: "208001",
              projectType: "DEMO residential construction",
              customerNotes:
                "DEMO data only - safe to edit or remove before production.",
              internalNotes: "DEMO Phase 2 workflow record.",
              status,
              currentRevisionNumber: approvalStatus ? 1 : 0,
              expiresAt: approvalStatus ? demoValidUntil : null,
              acceptedAt:
                status === QuotationStatus.ACCEPTED ? new Date() : null,
              items: {
                create: [
                  {
                    productId: demoProduct.id,
                    variantId: demoVariant.id,
                    description: "DEMO porcelain floor tile",
                    quantity: 2,
                    unitCode: "BOX",
                    sortOrder: 0,
                  },
                  {
                    productId: demoProduct.id,
                    variantId: demoVariant.id,
                    description: "DEMO matching tile allowance",
                    quantity: 1,
                    unitCode: "BOX",
                    sortOrder: 1,
                  },
                ],
              },
              history: {
                create: {
                  toStatus: status,
                  reason:
                    "Created by the idempotent Phase 2 demonstration seed.",
                },
              },
            },
            include: {
              items: true,
              revisions: { include: { items: true, approvals: true } },
            },
          })

          if (!approvalStatus) return quotation
          const lineValues = quotation.items.map((item) => {
            const quantity = Number(item.quantity)
            const lineSubtotal = quantity * 1299
            const gstAmount = lineSubtotal * 0.18
            return {
              quotationItemId: item.id,
              variantId: demoVariant.id,
              fulfilmentLocationId: demoLocation.id,
              supplierProductId: supplierProduct.id,
              description: item.description,
              quantity,
              unitCode: item.unitCode,
              unitPrice: 1299,
              gstPercent: 18,
              discountAmount: 0,
              lineSubtotal,
              gstAmount,
              lineTotal: lineSubtotal + gstAmount,
              estimatedLeadDays: 2,
            }
          })
          await prisma.quotationRevision.create({
            data: {
              quotationId: quotation.id,
              number: 1,
              validUntil: demoValidUntil,
              subtotal: 3897,
              gstTotal: 701.46,
              freightTotal: 750,
              discountTotal: 0,
              marginTotal: 600,
              grandTotal: 5348.46,
              customerNotes: "DEMO quotation valid for testing only.",
              internalNotes: "DEMO margin and allocation data.",
              sentAt:
                status === QuotationStatus.QUOTED ||
                status === QuotationStatus.ACCEPTED
                  ? new Date()
                  : null,
              items: { create: lineValues },
              approvals: {
                create: {
                  quotationId: quotation.id,
                  status: approvalStatus,
                  reason:
                    approvalStatus === QuotationApprovalStatus.APPROVED
                      ? "DEMO approved revision."
                      : "DEMO awaiting finance approval.",
                  decidedAt:
                    approvalStatus === QuotationApprovalStatus.APPROVED
                      ? new Date()
                      : null,
                },
              },
            },
          })
          return prisma.quotation.findUniqueOrThrow({
            where: { id: quotation.id },
            include: {
              items: true,
              revisions: { include: { items: true, approvals: true } },
            },
          })
        }

        await ensureDemoQuotation(
          "DEMO-BQ-SUBMITTED-001",
          QuotationStatus.SUBMITTED
        )
        await ensureDemoQuotation(
          "DEMO-BQ-REVIEWING-001",
          QuotationStatus.REVIEWING,
          QuotationApprovalStatus.PENDING
        )
        await ensureDemoQuotation(
          "DEMO-BQ-QUOTED-001",
          QuotationStatus.QUOTED,
          QuotationApprovalStatus.APPROVED
        )
        const acceptedQuotation = await ensureDemoQuotation(
          "DEMO-BQ-ACCEPTED-001",
          QuotationStatus.ACCEPTED,
          QuotationApprovalStatus.APPROVED
        )

        const existingDemoOrder = await prisma.salesOrder.findUnique({
          where: { reference: "DEMO-SO-ACCEPTED-001" },
        })
        const acceptedRevision = acceptedQuotation.revisions.find(
          (revision) => revision.number === 1
        )
        if (!existingDemoOrder && acceptedRevision) {
          await prisma.$transaction(async (tx) => {
            const order = await tx.salesOrder.create({
              data: {
                reference: "DEMO-SO-ACCEPTED-001",
                quotationId: acceptedQuotation.id,
                revisionId: acceptedRevision.id,
                status: SalesOrderStatus.CONFIRMED,
                paymentTerms: "DEMO: payment terms to be confirmed",
                paymentStatus: PaymentStatus.PENDING,
                customerName: acceptedQuotation.customerName,
                customerEmail: acceptedQuotation.customerEmail,
                customerPhone: acceptedQuotation.customerPhone,
                deliveryPincode: acceptedQuotation.deliveryPincode,
                subtotal: acceptedRevision.subtotal,
                gstTotal: acceptedRevision.gstTotal,
                freightTotal: acceptedRevision.freightTotal,
                discountTotal: acceptedRevision.discountTotal,
                grandTotal: acceptedRevision.grandTotal,
                reservedUntil: demoValidUntil,
                items: {
                  create: acceptedRevision.items.map((item) => ({
                    quotationItemId: item.quotationItemId,
                    variantId: demoVariant.id,
                    fulfilmentLocationId: demoLocation.id,
                    description: item.description,
                    quantity: Number(item.quantity),
                    unitCode: item.unitCode,
                    unitPrice: item.unitPrice,
                    gstPercent: item.gstPercent,
                    discountAmount: item.discountAmount,
                    lineSubtotal: item.lineSubtotal,
                    gstAmount: item.gstAmount,
                    lineTotal: item.lineTotal,
                  })),
                },
              },
              include: { items: true },
            })

            for (const [index, item] of order.items.entries()) {
              const balance = await tx.inventoryBalance.findUniqueOrThrow({
                where: {
                  variantId_fulfilmentLocationId: {
                    variantId: item.variantId,
                    fulfilmentLocationId: item.fulfilmentLocationId,
                  },
                },
              })
              const before = {
                physicalQuantity: balance.physicalQuantity,
                reservedQuantity: balance.reservedQuantity,
                blockedQuantity: balance.blockedQuantity,
                damagedQuantity: balance.damagedQuantity,
                quarantineQuantity: balance.quarantineQuantity,
                inTransitQuantity: balance.inTransitQuantity,
              }
              const updated = await tx.inventoryBalance.update({
                where: { id: balance.id },
                data: { reservedQuantity: { increment: item.quantity } },
              })
              const after = {
                ...before,
                reservedQuantity: updated.reservedQuantity,
              }
              await tx.inventoryReservation.create({
                data: {
                  reference: `DEMO-RES-SO-001-${index + 1}`,
                  variantId: item.variantId,
                  fulfilmentLocationId: item.fulfilmentLocationId,
                  quantity: item.quantity,
                  status: InventoryReservationStatus.ACTIVE,
                  expiresAt: demoValidUntil,
                  notes:
                    "DEMO reservation created with the accepted sales order.",
                  salesOrderItemId: item.id,
                },
              })
              await tx.inventoryLedgerEntry.create({
                data: {
                  balanceId: balance.id,
                  type: InventoryLedgerType.RESERVATION,
                  reservedDelta: item.quantity,
                  before,
                  after,
                  reason: "DEMO accepted quotation stock reservation.",
                  reference: order.reference,
                },
              })
            }
          })
        }
        await seedPhase3Operations(prisma, {
          supplierId: supplier.id,
          variantId: demoVariant.id,
          fulfilmentLocationId: demoLocation.id,
          carrierId: carrier.id,
        })
      }
    }
    console.log("Development catalog seed completed.")
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
