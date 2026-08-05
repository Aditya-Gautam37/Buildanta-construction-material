import { readFile } from "node:fs/promises"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import { prisma, ProductStatus, VariantStatus } from "@workspace/db"

type AssetKey = "cement" | "steel" | "waterproofing" | "electrical" | "bath" | "openings" | "ceiling" | "tiles" | "paint"
type VariantDefinition = { sku: string; price: number; attributes: Record<string, string>; unit?: string }
type ProductDefinition = {
  name: string
  brand: string
  categorySlug: string
  asset: AssetKey
  description: string
  price: number
  bulkPrice?: number
  unit: string
  minimumOrder: number
  gst: number
  stage: string
  rooms?: string[]
  specs: string[]
  variants: VariantDefinition[]
}

const priceNotice = "Indicative Kanpur market price updated August 2026. Final price, tax treatment, freight, batch, shade and availability are confirmed in the supplier quotation."

const assets: Record<AssetKey, { file: string; alt: string }> = {
  cement: { file: "real/cement.jpg", alt: "Cement and masonry materials at a construction site" },
  steel: { file: "real/steel.jpg", alt: "Reinforcement steel prepared for structural work" },
  waterproofing: { file: "real/waterproofing.jpg", alt: "Waterproofing work on a building surface" },
  electrical: { file: "real/electrical.jpg", alt: "Electrical cables prepared for concealed installation" },
  bath: { file: "real/bath.jpg", alt: "Bathroom fitting in a finished wash area" },
  openings: { file: "real/openings.jpg", alt: "Modern door and window installation" },
  ceiling: { file: "real/ceiling.jpg", alt: "Metal framing for a ceiling installation" },
  tiles: { file: "real/tiles.jpg", alt: "Floor tiles and installation tools" },
  paint: { file: "real/paint.jpg", alt: "Paint and surface-finishing tools" },
}

const products: ProductDefinition[] = [
  { name:"UltraTech Portland Pozzolana Cement — 50 kg",brand:"UltraTech Cement",categorySlug:"cement-structure/cement/ppc",asset:"cement",description:"Portland pozzolana cement for durable masonry, plastering and general concrete work.",price:386,bulkPrice:365,unit:"50 kg bag",minimumOrder:10,gst:28,stage:"Foundation & Structure",specs:["PPC grade","50 kg bag","General concrete, masonry and plastering"],variants:[{sku:"UTC-PPC-50KG",price:386,attributes:{grade:"PPC",pack:"50 kg"}}] },
  { name:"UltraTech OPC 53 Cement — 50 kg",brand:"UltraTech Cement",categorySlug:"cement-structure/cement/opc-53",asset:"cement",description:"High early-strength ordinary Portland cement for reinforced structural concrete.",price:414,bulkPrice:394,unit:"50 kg bag",minimumOrder:10,gst:28,stage:"Foundation & Structure",specs:["OPC 53 grade","50 kg bag","RCC and structural applications"],variants:[{sku:"UTC-OPC53-50KG",price:414,attributes:{grade:"OPC 53",pack:"50 kg"}}] },
  { name:"Magicrete AAC Block",brand:"Magicrete",categorySlug:"cement-structure/blocks-bricks/aac-blocks",asset:"cement",description:"Lightweight autoclaved aerated concrete block for internal and external masonry.",price:95,bulkPrice:89,unit:"piece",minimumOrder:100,gst:12,stage:"Walls & Masonry",specs:["600 × 200 mm nominal face","Lightweight masonry","Sizes subject to availability"],variants:[{sku:"MAG-AAC-600-100",price:78,attributes:{size:"600 × 200 × 100 mm"}},{sku:"MAG-AAC-600-150",price:95,attributes:{size:"600 × 200 × 150 mm"}},{sku:"MAG-AAC-600-200",price:118,attributes:{size:"600 × 200 × 200 mm"}}] },
  { name:"Tata Tiscon 550SD TMT Reinforcement Bar",brand:"Tata Tiscon",categorySlug:"steel-tmt/tmt-bars/fe550",asset:"steel",description:"High-strength, ductile TMT reinforcement bar for engineered RCC structures.",price:70,bulkPrice:67,unit:"kg",minimumOrder:100,gst:18,stage:"Foundation & Structure",specs:["Fe 550SD grade","BIS-compliant reinforcement","Test certificate subject to batch"],variants:[{sku:"TATA-550SD-8MM",price:72,attributes:{grade:"Fe 550SD",diameter:"8 mm"}},{sku:"TATA-550SD-10MM",price:71,attributes:{grade:"Fe 550SD",diameter:"10 mm"}},{sku:"TATA-550SD-12MM",price:70,attributes:{grade:"Fe 550SD",diameter:"12 mm"}},{sku:"TATA-550SD-16MM",price:70,attributes:{grade:"Fe 550SD",diameter:"16 mm"}}] },
  { name:"Tata Tiscon Annealed Binding Wire",brand:"Tata Tiscon",categorySlug:"steel-tmt/binding-wire",asset:"steel",description:"Annealed steel binding wire for tying reinforcement cages and meshes.",price:82,bulkPrice:77,unit:"kg",minimumOrder:25,gst:18,stage:"Foundation & Structure",specs:["Annealed binding wire","Reinforcement tying","Coil packing"],variants:[{sku:"TATA-BIND-1KG",price:82,attributes:{pack:"1 kg coil"}},{sku:"TATA-BIND-25KG",price:77,attributes:{pack:"25 kg bundle"}}] },
  { name:"Dr. Fixit Roofseal Select — 20 L",brand:"Dr. Fixit",categorySlug:"waterproofing/terrace",asset:"waterproofing",description:"Elastomeric waterproof coating for exposed roofs and terraces.",price:5650,bulkPrice:5290,unit:"20 L pail",minimumOrder:1,gst:18,stage:"Plastering & Waterproofing",rooms:["Balcony & Terrace"],specs:["20 litre pack","Terrace waterproofing","Coverage depends on substrate and coats"],variants:[{sku:"DRFIX-ROOFSEAL-20L",price:5650,attributes:{pack:"20 L",application:"Terrace"}}] },
  { name:"Dr. Fixit Bathseal 2K Waterproofing Kit",brand:"Dr. Fixit",categorySlug:"waterproofing/bathroom",asset:"waterproofing",description:"Two-component cementitious waterproofing system for bathrooms before tiling.",price:2380,bulkPrice:2210,unit:"15 kg kit",minimumOrder:1,gst:18,stage:"Plastering & Waterproofing",rooms:["Bathroom"],specs:["Two-component system","Wet-area application","Apply before tiling"],variants:[{sku:"DRFIX-BATHSEAL-15KG",price:2380,attributes:{pack:"15 kg kit",application:"Bathroom"}}] },
  { name:"Sikaflex-11 FC+ Polyurethane Sealant",brand:"Sika",categorySlug:"waterproofing/sealants",asset:"waterproofing",description:"Elastic polyurethane adhesive and joint sealant for construction applications.",price:790,bulkPrice:735,unit:"600 ml sausage",minimumOrder:12,gst:18,stage:"Plastering & Waterproofing",specs:["Polyurethane sealant","Elastic joint sealing","600 ml sausage"],variants:[{sku:"SIKA-11FC-GREY-600",price:790,attributes:{colour:"Grey",pack:"600 ml"}},{sku:"SIKA-11FC-WHITE-600",price:815,attributes:{colour:"White",pack:"600 ml"}}] },
  { name:"Polycab Etira FR-LF House Wire",brand:"Polycab",categorySlug:"electrical/wires-cables/copper-wires",asset:"electrical",description:"Flame-retardant, lead-free copper house wire for residential circuits.",price:1990,bulkPrice:1870,unit:"90 m coil",minimumOrder:1,gst:18,stage:"Electrical & Wiring",rooms:["Living room","Bedroom","Kitchen"],specs:["90 metre coil","Copper conductor","FR-LF insulation"],variants:[{sku:"POLY-ETIRA-1.5-90",price:1990,attributes:{size:"1.5 sq mm",length:"90 m"}},{sku:"POLY-ETIRA-2.5-90",price:3075,attributes:{size:"2.5 sq mm",length:"90 m"}},{sku:"POLY-ETIRA-4.0-90",price:4725,attributes:{size:"4 sq mm",length:"90 m"}}] },
  { name:"Anchor Roma Classic Modular Switch",brand:"Anchor by Panasonic",categorySlug:"electrical/switches-sockets/modular",asset:"electrical",description:"Residential modular switch mechanism for Roma Classic plates.",price:125,bulkPrice:112,unit:"piece",minimumOrder:10,gst:18,stage:"Electrical & Wiring",rooms:["Living room","Bedroom","Kitchen"],specs:["Modular mechanism","White finish","Residential switchboard use"],variants:[{sku:"ANCH-ROMA-6A-1W",price:125,attributes:{rating:"6A",type:"One-way"}},{sku:"ANCH-ROMA-6A-2W",price:185,attributes:{rating:"6A",type:"Two-way"}},{sku:"ANCH-ROMA-16A-1W",price:225,attributes:{rating:"16A",type:"One-way"}}] },
  { name:"Legrand DX³ Miniature Circuit Breaker",brand:"Legrand",categorySlug:"electrical/protection/mcb",asset:"electrical",description:"DIN-rail miniature circuit breaker for residential distribution boards.",price:385,bulkPrice:350,unit:"piece",minimumOrder:4,gst:18,stage:"Electrical & Wiring",specs:["C-curve MCB","DIN-rail mounting","Breaking capacity depends on model"],variants:[{sku:"LEG-DX3-SP-C6",price:385,attributes:{poles:"SP",rating:"6A",curve:"C"}},{sku:"LEG-DX3-SP-C16",price:395,attributes:{poles:"SP",rating:"16A",curve:"C"}},{sku:"LEG-DX3-DP-C32",price:1080,attributes:{poles:"DP",rating:"32A",curve:"C"}}] },
  { name:"Philips Slimline LED Batten — 20W",brand:"Philips",categorySlug:"electrical/lighting/led-battens",asset:"electrical",description:"Slim integrated LED batten for residential rooms and utility areas.",price:610,bulkPrice:565,unit:"piece",minimumOrder:4,gst:12,stage:"Electrical & Wiring",rooms:["Living room","Bedroom","Kitchen"],specs:["20 watt","Integrated LED","Cool daylight"],variants:[{sku:"PHIL-SLIMLINE-20W-CDL",price:610,attributes:{power:"20W",colour:"Cool daylight"}}] },
  { name:"Jaquar Continental Single Lever Basin Mixer",brand:"Jaquar",categorySlug:"sanitaryware-bathware/faucets/basin",asset:"bath",description:"Chrome-finished single-lever basin mixer with ceramic cartridge.",price:4650,bulkPrice:4320,unit:"piece",minimumOrder:1,gst:18,stage:"Bathroom & Plumbing",rooms:["Bathroom"],specs:["Single-lever operation","Chrome finish","Deck mounted"],variants:[{sku:"JAQ-CON-BASIN-MIX-CHR",price:4650,attributes:{finish:"Chrome",mounting:"Deck mounted"}}] },
  { name:"Hindware Element Wall-Hung Water Closet",brand:"Hindware",categorySlug:"sanitaryware-bathware/toilets/wall-hung",asset:"bath",description:"Wall-hung ceramic water closet for concealed-cistern installations.",price:10950,bulkPrice:10150,unit:"set",minimumOrder:1,gst:18,stage:"Bathroom & Plumbing",rooms:["Bathroom"],specs:["Wall-hung installation","Soft-close seat subject to model","White ceramic"],variants:[{sku:"HIND-ELEMENT-WH-WHITE",price:10950,attributes:{colour:"White",type:"Wall hung"}}] },
  { name:"Jaquar Round Overhead Shower — 200 mm",brand:"Jaquar",categorySlug:"sanitaryware-bathware/showers",asset:"bath",description:"Round overhead shower with easy-clean nozzles and chrome finish.",price:2490,bulkPrice:2290,unit:"piece",minimumOrder:1,gst:18,stage:"Bathroom & Plumbing",rooms:["Bathroom"],specs:["200 mm face","Chrome finish","Overhead installation"],variants:[{sku:"JAQ-OHS-200-CHR",price:2490,attributes:{size:"200 mm",finish:"Chrome"}}] },
  { name:"Fenesta uPVC Sliding Window",brand:"Fenesta",categorySlug:"doors-windows/windows/upvc",asset:"openings",description:"Made-to-measure uPVC sliding window system with glazing and installation options.",price:8500,bulkPrice:7900,unit:"sq m",minimumOrder:1,gst:18,stage:"Doors, Windows, Railings & Glass",rooms:["Living room","Bedroom"],specs:["Made to measured opening","uPVC profile","Price varies with glazing and hardware"],variants:[{sku:"FEN-UPVC-2T-CLEAR",price:8500,attributes:{track:"2 track",glazing:"Clear glass"}},{sku:"FEN-UPVC-3T-MESH",price:11200,attributes:{track:"3 track",glazing:"Clear glass + mesh"}}] },
  { name:"CenturyPly Sainik 710 Flush Door",brand:"CenturyPly",categorySlug:"doors-windows/doors/internal",asset:"openings",description:"Factory-made flush door shutter for residential interior rooms.",price:6150,bulkPrice:5750,unit:"shutter",minimumOrder:1,gst:18,stage:"Doors, Windows, Railings & Glass",rooms:["Living room","Bedroom"],specs:["30 mm shutter","Standard room-door sizes","Finish and frame quoted separately"],variants:[{sku:"CENT-S710-2100-900",price:6150,attributes:{size:"2100 × 900 mm",thickness:"30 mm"}},{sku:"CENT-S710-2100-750",price:5520,attributes:{size:"2100 × 750 mm",thickness:"30 mm"}}] },
  { name:"Godrej Mortise Lock with Lever Handle",brand:"Godrej",categorySlug:"doors-windows/hardware",asset:"openings",description:"Mortise lock body with lever-handle set for wooden doors.",price:2590,bulkPrice:2380,unit:"set",minimumOrder:2,gst:18,stage:"Doors, Windows, Railings & Glass",rooms:["Living room","Bedroom"],specs:["Mortise lock body","Lever-handle pair","Finish depends on variant"],variants:[{sku:"GOD-MORTISE-SATIN",price:2590,attributes:{finish:"Satin steel"}},{sku:"GOD-MORTISE-ANTIQUE",price:2890,attributes:{finish:"Antique brass"}}] },
  { name:"Saint-Gobain Gyproc Standard Board",brand:"Gyproc",categorySlug:"false-ceiling-drywall/boards/gypsum",asset:"ceiling",description:"Paper-faced gypsum plasterboard for interior ceilings and partitions.",price:515,bulkPrice:485,unit:"board",minimumOrder:10,gst:18,stage:"False Ceiling",rooms:["Living room","Bedroom"],specs:["1200 × 2400 mm","Interior dry-area use","12.5 mm standard board"],variants:[{sku:"GYPROC-STD-12.5",price:515,attributes:{size:"1200 × 2400 mm",thickness:"12.5 mm",type:"Standard"}},{sku:"GYPROC-MR-12.5",price:690,attributes:{size:"1200 × 2400 mm",thickness:"12.5 mm",type:"Moisture resistant"}}] },
  { name:"Gyproc GI Ceiling Section",brand:"Gyproc",categorySlug:"false-ceiling-drywall/framing",asset:"ceiling",description:"Galvanized steel ceiling section for suspended gypsum-board frameworks.",price:230,bulkPrice:210,unit:"length",minimumOrder:20,gst:18,stage:"False Ceiling",rooms:["Living room","Bedroom"],specs:["Galvanized steel","Ceiling framework","Length subject to model"],variants:[{sku:"GYPROC-GI-3660",price:230,attributes:{length:"3660 mm",type:"Ceiling section"}}] },
  { name:"Gyproc Pro-Fill Jointing Compound — 20 kg",brand:"Gyproc",categorySlug:"false-ceiling-drywall/finishing",asset:"ceiling",description:"Jointing compound for gypsum-board joints, fasteners and surface finishing.",price:1220,bulkPrice:1140,unit:"20 kg bag",minimumOrder:1,gst:18,stage:"False Ceiling",rooms:["Living room","Bedroom"],specs:["20 kg pack","Gypsum-board joint finishing","Use with joint tape"],variants:[{sku:"GYPROC-PROFILL-20KG",price:1220,attributes:{pack:"20 kg"}}] },
  { name:"Kajaria Glazed Vitrified Floor Tile",brand:"Kajaria",categorySlug:"tiles-flooring/floor-tiles/glossy",asset:"tiles",description:"Glazed vitrified floor tile for residential dry interiors.",price:1780,bulkPrice:1650,unit:"box",minimumOrder:5,gst:18,stage:"Flooring & Tiling",rooms:["Living room","Bedroom"],specs:["Glazed vitrified tile","Batch and shade matching required","Box coverage depends on size"],variants:[{sku:"KAJ-GVT-600-1200-GLOSS",price:1780,attributes:{size:"600 × 1200 mm",finish:"Glossy"}},{sku:"KAJ-GVT-600-600-GLOSS",price:1120,attributes:{size:"600 × 600 mm",finish:"Glossy"}}] },
  { name:"Kajaria Anti-Skid Ceramic Floor Tile",brand:"Kajaria",categorySlug:"tiles-flooring/floor-tiles/anti-skid",asset:"tiles",description:"Slip-resistant ceramic floor tile for bathrooms, balconies and utility areas.",price:860,bulkPrice:790,unit:"box",minimumOrder:4,gst:18,stage:"Flooring & Tiling",rooms:["Bathroom","Balcony & Terrace"],specs:["Anti-skid finish","Wet-area application","Shade matching required"],variants:[{sku:"KAJ-AS-300-300",price:860,attributes:{size:"300 × 300 mm",finish:"Anti-skid"}}] },
  { name:"Kajaria Ceramic Wall Tile",brand:"Kajaria",categorySlug:"tiles-flooring/wall-tiles",asset:"tiles",description:"Ceramic wall tile for kitchen and bathroom applications.",price:930,bulkPrice:850,unit:"box",minimumOrder:4,gst:18,stage:"Flooring & Tiling",rooms:["Kitchen","Bathroom"],specs:["Ceramic wall tile","Kitchen and bathroom use","Shade matching required"],variants:[{sku:"KAJ-WALL-300-600",price:930,attributes:{size:"300 × 600 mm",finish:"Satin"}}] },
  { name:"Asian Paints Royale Luxury Emulsion — 20 L",brand:"Asian Paints",categorySlug:"paints-finishing/interior/emulsion",asset:"paint",description:"Premium washable interior-wall emulsion with a smooth soft-sheen finish.",price:9355,bulkPrice:8981,unit:"20 L pail",minimumOrder:1,gst:18,stage:"Paint & Finishing",rooms:["Living room","Bedroom"],specs:["20 litre pack","Washable interior finish","Final price varies by shade and base"],variants:[{sku:"AP-ROYALE-20L-WHITE",price:9355,attributes:{pack:"20 L",base:"White/pastel"}},{sku:"AP-ROYALE-10L-WHITE",price:7750,attributes:{pack:"10 L",base:"White/pastel"}},{sku:"AP-ROYALE-4L-WHITE",price:3170,attributes:{pack:"4 L",base:"White/pastel"}}] },
  { name:"Asian Paints Apex Ultima Exterior Emulsion",brand:"Asian Paints",categorySlug:"paints-finishing/exterior/emulsion",asset:"paint",description:"Premium exterior-wall emulsion for weather protection and decorative finish.",price:14200,bulkPrice:12900,unit:"20 L pail",minimumOrder:1,gst:18,stage:"Paint & Finishing",specs:["Exterior masonry coating","Weather-resistant system","Price varies by shade and base"],variants:[{sku:"AP-APEXULT-20L",price:14200,attributes:{pack:"20 L",application:"Exterior"}},{sku:"AP-APEXULT-10L",price:7350,attributes:{pack:"10 L",application:"Exterior"}}] },
  { name:"Asian Paints Decoprime Wall Primer",brand:"Asian Paints",categorySlug:"paints-finishing/primer",asset:"paint",description:"Wall primer for prepared masonry surfaces before interior emulsion application.",price:4450,bulkPrice:4050,unit:"20 L pail",minimumOrder:1,gst:18,stage:"Paint & Finishing",rooms:["Living room","Bedroom"],specs:["20 litre pack","Wall surface preparation","Use before compatible top coat"],variants:[{sku:"AP-DECOPRIME-WT-20L",price:4450,attributes:{pack:"20 L",type:"Water thinnable"}},{sku:"AP-DECOPRIME-ST-20L",price:4890,attributes:{pack:"20 L",type:"Solvent thinnable"}}] },
]

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

async function consolidateRoots() {
  const canonical = new Map((await prisma.category.findMany({ where:{slug:{in:["cement-structure","steel-tmt","waterproofing","electrical","sanitaryware-bathware","doors-windows","false-ceiling-drywall","tiles-flooring","paints"]}} })).map((item)=>[item.slug,item]))
  const paints = canonical.get("paints")
  const legacyPaints = await prisma.category.findUnique({ where:{slug:"paints-finishing"} })
  if (paints && legacyPaints) {
    await prisma.category.updateMany({ where:{parentId:legacyPaints.id}, data:{parentId:paints.id} })
  }
  for (const slug of ["bricks-blocks","plumbing-sanitary","paints-finishing","flooring"]) {
    const node = await prisma.category.findUnique({where:{slug},include:{_count:{select:{children:true,products:true}}}})
    if (!node) continue
    if (node._count.children === 0 && node._count.products === 0) await prisma.category.delete({where:{id:node.id}})
    else await prisma.category.update({where:{id:node.id},data:{published:false,featured:false}})
  }
  await prisma.category.updateMany({where:{slug:{in:[...canonical.keys()]}},data:{published:true,featured:true}})
}

async function main() {
  if (process.env.CONFIRM_REAL_CATALOGUE !== "IMPORT_VERIFIED_PRODUCTS") {
    throw new Error("Set CONFIRM_REAL_CATALOGUE=IMPORT_VERIFIED_PRODUCTS before importing the production catalogue.")
  }
  await consolidateRoots()
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !secretKey) throw new Error("Supabase URL and server secret key are required.")
  const storage = createClient(supabaseUrl, secretKey, {auth:{persistSession:false,autoRefreshToken:false}})
  const bucket = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET ?? "ProductPhotos"
  const assetDirectory = path.resolve(process.cwd(), "../../../public/demo/products")
  const imageUrls = new Map<AssetKey,string>()
  for (const [key,asset] of Object.entries(assets) as [AssetKey,(typeof assets)[AssetKey]][]) {
    const objectPath = `real-catalogue/${asset.file.replace("real/","")}`
    const {error} = await storage.storage.from(bucket).upload(objectPath,await readFile(path.join(assetDirectory,asset.file)),{contentType:"image/jpeg",cacheControl:"31536000",upsert:true})
    if (error) throw new Error(`Unable to upload ${asset.file}: ${error.message}`)
    imageUrls.set(key,storage.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl)
  }
  const supplier = await prisma.supplier.upsert({where:{email:"catalogue@buildanta.in"},update:{name:"Buildanta Marketplace",contactInfo:priceNotice},create:{name:"Buildanta Marketplace",email:"catalogue@buildanta.in",contactInfo:priceNotice}})
  const stages = new Map((await prisma.stage.findMany()).map((item)=>[item.name,item.id]))
  const rooms = new Map((await prisma.room.findMany()).map((item)=>[item.name,item.id]))
  let productCount = 0
  let variantCount = 0
  for (const definition of products) {
    const category = await prisma.category.findUnique({where:{slug:definition.categorySlug}})
    if (!category) throw new Error(`Missing category ${definition.categorySlug}`)
    const stageId = stages.get(definition.stage)
    if (!stageId) throw new Error(`Missing stage ${definition.stage}`)
    const roomIds = (definition.rooms ?? []).map((name)=>rooms.get(name)).filter((id):id is string=>Boolean(id))
    const brandSlug = slugify(definition.brand)
    const brand = await prisma.brand.upsert({where:{slug:brandSlug},update:{name:definition.brand},create:{name:definition.brand,slug:brandSlug,description:`Manufacturer brand represented in the Buildanta marketplace catalogue.`}})
    const firstSku = definition.variants[0]!.sku
    const existing = await prisma.productVariant.findUnique({where:{sku:firstSku},select:{productId:true}})
    const common = {name:definition.name,description:`${definition.description} ${priceNotice}`,keySpecifications:[...definition.specs,priceNotice],brandId:brand.id,sellingPrice:definition.price,bulkPrice:definition.bulkPrice,gstPercent:definition.gst,unit:definition.unit,minimumOrderQuantity:definition.minimumOrder,deliveryInfo:"Freight and delivery time are confirmed after PIN-code and quantity review.",status:ProductStatus.PUBLISHED,publishedAt:new Date()}
    const product = existing
      ? await prisma.product.update({where:{id:existing.productId},data:{...common,categories:{set:[{id:category.id}]},stages:{set:[{id:stageId}]},rooms:{set:roomIds.map((id)=>({id}))}}})
      : await prisma.product.create({data:{...common,categories:{connect:[{id:category.id}]},stages:{connect:[{id:stageId}]},rooms:{connect:roomIds.map((id)=>({id}))}}})
    const keepSkus:string[] = []
    for (const variantDefinition of definition.variants) {
      keepSkus.push(variantDefinition.sku)
      await prisma.productVariant.upsert({where:{sku:variantDefinition.sku},update:{productId:product.id,supplierId:supplier.id,price:variantDefinition.price,attributes:variantDefinition.attributes,unit:variantDefinition.unit??definition.unit,minimumOrderQuantity:definition.minimumOrder,stockTracked:false,status:VariantStatus.ACTIVE},create:{productId:product.id,supplierId:supplier.id,sku:variantDefinition.sku,price:variantDefinition.price,attributes:variantDefinition.attributes,unit:variantDefinition.unit??definition.unit,minimumOrderQuantity:definition.minimumOrder,stockTracked:false,status:VariantStatus.ACTIVE}})
      variantCount += 1
    }
    await prisma.productVariant.updateMany({where:{productId:product.id,sku:{notIn:keepSkus}},data:{status:VariantStatus.DISCONTINUED}})
    const imageUrl = imageUrls.get(definition.asset)!
    const currentImage = await prisma.productImage.findFirst({where:{productId:product.id,primary:true}})
    if (currentImage) await prisma.productImage.update({where:{id:currentImage.id},data:{src:imageUrl,alt:assets[definition.asset].alt,primary:true,sortOrder:0}})
    else await prisma.productImage.create({data:{productId:product.id,src:imageUrl,alt:assets[definition.asset].alt,primary:true,sortOrder:0}})
    productCount += 1
  }
  console.log(JSON.stringify({status:"complete",canonicalDepartments:9,products:productCount,variants:variantCount,brands:await prisma.brand.count(),supplier:supplier.name,priceBasis:"Indicative Kanpur market, August 2026"},null,2))
}

main().catch((error)=>{console.error(error);process.exitCode=1}).finally(async()=>prisma.$disconnect())
