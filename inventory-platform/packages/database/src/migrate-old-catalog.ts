import { config } from 'dotenv';
import { basename, extname } from 'node:path';
import { resolve } from 'node:path';
import { prisma } from './client';

const SOURCE_API = 'https://buildanta-monorepo-nest-api.vercel.app';
const applyChanges = process.argv.includes('--apply');

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../../apps/inventory-management/.env.local') });

type TaxonomyRecord = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

type BrandRecord = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
};

type SupplierRecord = {
  id: string;
  name: string;
  contactInfo: string | null;
  email: string | null;
  address: string | null;
};

type ImageRecord = {
  id: string;
  src: string;
  alt: string;
  productId: string;
  variantId: string | null;
};

type VariantRecord = {
  id: string;
  productId: string;
  sku: string;
  price: string | number | null;
  attributes: unknown;
  supplierId: string;
  images?: ImageRecord[];
};

type ProductRecord = {
  id: string;
  name: string;
  description: string | null;
  keySpecifications: string[];
  brandId: string;
  sellingPrice: string | number;
  costPrice: string | number | null;
  dummyPrice: string | number | null;
  categories: Array<{ id: string }>;
  stages: Array<{ id: string }>;
  rooms: Array<{ id: string }>;
  images: ImageRecord[];
  variants: VariantRecord[];
};

type Catalog = {
  categories: TaxonomyRecord[];
  brands: BrandRecord[];
  suppliers: SupplierRecord[];
  stages: TaxonomyRecord[];
  rooms: TaxonomyRecord[];
  variants: VariantRecord[];
  products: ProductRecord[];
};

async function sourceJson<T>(path: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(`${SOURCE_API}${path}`, {
        headers: { accept: 'application/json', 'user-agent': 'BuildantaCatalogMigration/1.0' },
      });
      if (response.ok) return (await response.json()) as T;
      lastError = new Error(`Old inventory request failed for ${path} (${response.status}).`);
      if (response.status < 500) break;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 750));
  }
  throw lastError instanceof Error ? lastError : new Error(`Old inventory request failed for ${path}.`);
}

async function loadCatalog(): Promise<Catalog> {
  const [categories, brands, suppliers, stages, rooms, variants] = await Promise.all([
    sourceJson<TaxonomyRecord[]>('/categories'),
    sourceJson<BrandRecord[]>('/brands'),
    sourceJson<SupplierRecord[]>('/suppliers'),
    sourceJson<TaxonomyRecord[]>('/stages'),
    sourceJson<TaxonomyRecord[]>('/rooms'),
    sourceJson<VariantRecord[]>('/product-variants'),
  ]);

  const productIds = [...new Set(variants.map((variant) => variant.productId))];
  const products: ProductRecord[] = [];
  for (const productId of productIds) {
    products.push(await sourceJson<ProductRecord>(`/products/${productId}`));
  }

  return { categories, brands, suppliers, stages, rooms, variants, products };
}

function publicObjectUrl(baseUrl: string, bucket: string, objectPath: string) {
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  return `${baseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

function safeObjectName(source: string, recordId: string) {
  const sourceName = basename(new URL(source).pathname) || recordId;
  return `${recordId}-${sourceName}`.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-180);
}

function extensionFor(contentType: string, source: string) {
  const existing = extname(new URL(source).pathname);
  if (existing) return existing;
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('avif')) return '.avif';
  return '.jpg';
}

async function mirrorImage(source: string | null, bucket: 'BrandLogos' | 'ProductPhotos', recordId: string) {
  if (!source) return null;

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required for media migration.');
  }

  try {
    const sourceResponse = await fetch(source, {
      headers: { 'user-agent': 'BuildantaCatalogMigration/1.0' },
    });
    if (!sourceResponse.ok) throw new Error(`source returned ${sourceResponse.status}`);

    const contentType = sourceResponse.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg';
    if (contentType === 'image/svg+xml' || source.toLowerCase().endsWith('.svg')) {
      console.warn(`Keeping trusted SVG at its existing URL: ${recordId}`);
      return source;
    }

    let objectName = safeObjectName(source, recordId);
    if (!extname(objectName)) objectName += extensionFor(contentType, source);
    const objectPath = `migrated/${objectName}`;
    const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`, {
      method: 'POST',
      headers: {
        apikey: secretKey,
        authorization: `Bearer ${secretKey}`,
        'content-type': contentType,
        'x-upsert': 'true',
        'user-agent': 'BuildantaCatalogMigration/1.0',
      },
      body: Buffer.from(await sourceResponse.arrayBuffer()),
    });

    if (!uploadResponse.ok) {
      throw new Error(`upload returned ${uploadResponse.status}: ${await uploadResponse.text()}`);
    }
    return publicObjectUrl(supabaseUrl, bucket, objectPath);
  } catch (error) {
    console.warn(`Media copy failed for ${recordId}; keeping the existing public URL.`, error);
    return source;
  }
}

async function targetCounts() {
  const [products, variants, categories, brands, suppliers, stages, rooms, images] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.supplier.count(),
    prisma.stage.count(),
    prisma.room.count(),
    prisma.productImage.count(),
  ]);
  return { products, variants, categories, brands, suppliers, stages, rooms, images };
}

async function importBrands(records: BrandRecord[]) {
  const idMap = new Map<string, string>();
  for (const record of records) {
    const existing = await prisma.brand.findFirst({
      where: { OR: [{ id: record.id }, { slug: record.slug }, { name: record.name }] },
    });
    const logo = await mirrorImage(record.logo, 'BrandLogos', record.id);
    const saved = existing
      ? await prisma.brand.update({
          where: { id: existing.id },
          data: { name: record.name, slug: record.slug, logo, description: record.description, website: record.website },
        })
      : await prisma.brand.create({ data: { ...record, logo } });
    idMap.set(record.id, saved.id);
  }
  return idMap;
}

async function importTaxonomy(
  records: TaxonomyRecord[],
  model: 'category' | 'stage' | 'room',
) {
  const idMap = new Map<string, string>();
  for (const record of records) {
    const delegate = prisma[model] as typeof prisma.category;
    const existing = await delegate.findFirst({
      where: { OR: [{ id: record.id }, { slug: record.slug }] },
    });
    const saved = existing
      ? await delegate.update({ where: { id: existing.id }, data: { name: record.name, slug: record.slug } })
      : await delegate.create({ data: { id: record.id, name: record.name, slug: record.slug } });
    idMap.set(record.id, saved.id);
  }

  for (const record of records) {
    const delegate = prisma[model] as typeof prisma.category;
    await delegate.update({
      where: { id: idMap.get(record.id)! },
      data: { parentId: record.parentId ? (idMap.get(record.parentId) ?? null) : null },
    });
  }
  return idMap;
}

async function importSuppliers(records: SupplierRecord[]) {
  const idMap = new Map<string, string>();
  for (const record of records) {
    const existing = await prisma.supplier.findFirst({
      where: {
        OR: [
          { id: record.id },
          { name: record.name },
          ...(record.email ? [{ email: record.email }] : []),
        ],
      },
    });
    const data = {
      name: record.name,
      contactInfo: record.contactInfo,
      email: record.email,
      address: record.address,
    };
    const saved = existing
      ? await prisma.supplier.update({ where: { id: existing.id }, data })
      : await prisma.supplier.create({ data: { id: record.id, ...data } });
    idMap.set(record.id, saved.id);
  }
  return idMap;
}

async function importProducts(
  records: ProductRecord[],
  brandIds: Map<string, string>,
  categoryIds: Map<string, string>,
  stageIds: Map<string, string>,
  roomIds: Map<string, string>,
) {
  const idMap = new Map<string, string>();
  for (const record of records) {
    const brandId = brandIds.get(record.brandId);
    if (!brandId) throw new Error(`Brand mapping is missing for product ${record.id}.`);
    const categories = record.categories.flatMap((item) => categoryIds.get(item.id) ? [{ id: categoryIds.get(item.id)! }] : []);
    const stages = record.stages.flatMap((item) => stageIds.get(item.id) ? [{ id: stageIds.get(item.id)! }] : []);
    const rooms = record.rooms.flatMap((item) => roomIds.get(item.id) ? [{ id: roomIds.get(item.id)! }] : []);
    const scalars = {
      name: record.name,
      description: record.description,
      keySpecifications: record.keySpecifications ?? [],
      brandId,
      sellingPrice: record.sellingPrice,
      costPrice: record.costPrice,
      dummyPrice: record.dummyPrice,
    };
    const saved = await prisma.product.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        ...scalars,
        categories: { connect: categories },
        stages: { connect: stages },
        rooms: { connect: rooms },
      },
      update: {
        ...scalars,
        categories: { set: categories },
        stages: { set: stages },
        rooms: { set: rooms },
      },
    });
    idMap.set(record.id, saved.id);
  }
  return idMap;
}

async function importVariants(
  records: VariantRecord[],
  productIds: Map<string, string>,
  supplierIds: Map<string, string>,
) {
  const idMap = new Map<string, string>();
  for (const record of records) {
    const productId = productIds.get(record.productId);
    const supplierId = supplierIds.get(record.supplierId);
    if (!productId || !supplierId) throw new Error(`Variant relation mapping is missing for ${record.id}.`);
    const existing = await prisma.productVariant.findFirst({
      where: { OR: [{ id: record.id }, { sku: record.sku }] },
    });
    const data = {
      productId,
      supplierId,
      sku: record.sku,
      price: record.price,
      attributes: JSON.parse(JSON.stringify(record.attributes ?? {})),
    };
    const saved = existing
      ? await prisma.productVariant.update({ where: { id: existing.id }, data })
      : await prisma.productVariant.create({ data: { id: record.id, ...data } });
    idMap.set(record.id, saved.id);
  }
  return idMap;
}

async function importImages(
  products: ProductRecord[],
  productIds: Map<string, string>,
  variantIds: Map<string, string>,
) {
  const images = new Map<string, ImageRecord>();
  for (const product of products) {
    for (const image of product.images ?? []) images.set(image.id, image);
    for (const variant of product.variants ?? []) {
      for (const image of variant.images ?? []) images.set(image.id, image);
    }
  }

  for (const image of images.values()) {
    const productId = productIds.get(image.productId);
    if (!productId) continue;
    const src = await mirrorImage(image.src, 'ProductPhotos', image.id);
    if (!src) continue;
    await prisma.productImage.upsert({
      where: { id: image.id },
      create: {
        id: image.id,
        src,
        alt: image.alt || 'Buildanta product image',
        productId,
        variantId: image.variantId ? (variantIds.get(image.variantId) ?? null) : null,
      },
      update: {
        src,
        alt: image.alt || 'Buildanta product image',
        productId,
        variantId: image.variantId ? (variantIds.get(image.variantId) ?? null) : null,
      },
    });
  }
}

async function main() {
  const catalog = await loadCatalog();
  console.log('Old catalog available:', {
    products: catalog.products.length,
    variants: catalog.variants.length,
    categories: catalog.categories.length,
    brands: catalog.brands.length,
    suppliers: catalog.suppliers.length,
    stages: catalog.stages.length,
    rooms: catalog.rooms.length,
  });
  console.log('New catalog before migration:', await targetCounts());

  if (!applyChanges) {
    console.log('Dry run complete. Run again with --apply to import these records.');
    return;
  }

  const brandIds = await importBrands(catalog.brands);
  const categoryIds = await importTaxonomy(catalog.categories, 'category');
  const stageIds = await importTaxonomy(catalog.stages, 'stage');
  const roomIds = await importTaxonomy(catalog.rooms, 'room');
  const supplierIds = await importSuppliers(catalog.suppliers);
  const productIds = await importProducts(catalog.products, brandIds, categoryIds, stageIds, roomIds);
  const variantIds = await importVariants(catalog.variants, productIds, supplierIds);
  await importImages(catalog.products, productIds, variantIds);

  console.log('New catalog after migration:', await targetCounts());
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
