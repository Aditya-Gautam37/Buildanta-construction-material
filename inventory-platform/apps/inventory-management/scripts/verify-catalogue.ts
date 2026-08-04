import { prisma, ProductStatus, VariantStatus } from "@workspace/db"

async function main() {
  const reference = process.argv.find((value) => value.startsWith("BQ-"))
  const [categories, products, invalidNumericNodes, duplicateSlugs, quote] = await Promise.all([
    prisma.category.findMany({ where:{published:true}, select:{id:true,name:true,parentId:true,sortOrder:true}, orderBy:[{sortOrder:"asc"},{name:"asc"}] }),
    prisma.product.findMany({ where:{status:ProductStatus.PUBLISHED}, select:{id:true,name:true,categories:{where:{published:true},select:{id:true}},images:{select:{id:true,primary:true}},variants:{where:{status:VariantStatus.ACTIVE},select:{id:true,sku:true}}} }),
    prisma.category.count({where:{name:{in:["1","2"]}}}),
    prisma.$queryRaw<Array<{slug:string;count:bigint}>>`SELECT "slug", COUNT(*) AS "count" FROM "Category" GROUP BY "slug" HAVING COUNT(*) > 1`,
    reference ? prisma.quoteRequest.findUnique({where:{reference},select:{reference:true,requirement:true,status:true}}) : null,
  ])
  const ids = new Set(categories.map((item)=>item.id))
  const orphans = categories.filter((item)=>item.parentId&&!ids.has(item.parentId))
  const missingCategory = products.filter((item)=>item.categories.length===0)
  const missingVariant = products.filter((item)=>item.variants.length===0)
  const missingImage = products.filter((item)=>item.images.length===0)
  const roots = categories.filter((item)=>!item.parentId)
  const result = {publishedCategories:categories.length,topLevelCategories:roots.length,topLevelOrder:roots.map((item)=>item.name),publishedProducts:products.length,invalidNumericNodes,duplicateSlugs:duplicateSlugs.length,orphanedPublishedNodes:orphans.length,publishedProductsWithoutCategory:missingCategory.length,publishedProductsWithoutActiveVariant:missingVariant.length,publishedProductsWithoutImage:missingImage.length,quoteVerification:quote}
  console.log(JSON.stringify(result,null,2))
  if(invalidNumericNodes||duplicateSlugs.length||orphans.length||missingCategory.length||missingVariant.length||missingImage.length||(reference&&!quote))process.exitCode=1
}

main().catch((error)=>{console.error(error);process.exitCode=1}).finally(async()=>prisma.$disconnect())
