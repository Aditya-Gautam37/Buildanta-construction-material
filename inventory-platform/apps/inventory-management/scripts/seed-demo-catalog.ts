import { readFile } from "node:fs/promises"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import { prisma, ProductStatus, VariantStatus } from "@workspace/db"

type AssetKey = "cement" | "steel" | "waterproofing" | "electrical" | "bath" | "openings" | "ceiling" | "tiles" | "paint"
type TaxonomyNode = { path: string; name: string; parent?: string; description: string; icon: string; asset: AssetKey }
type DemoProduct = {
  sku: string; name: string; description: string; brand: string; leaf: string; asset: AssetKey
  price: number; bulkPrice?: number; unit: string; minimumOrder: number; gst: number
  stock: number; threshold: number; specs: string[]; attributes: Record<string, string>; alt: string
}

const assets: Record<AssetKey, { file: string; alt: string }> = {
  cement: { file: "real/cement.jpg", alt: "Cement bags stored at an active construction site" },
  steel: { file: "real/steel.jpg", alt: "Construction worker inspecting reinforcement steel on site" },
  waterproofing: { file: "real/waterproofing.jpg", alt: "Roofing contractor working on a weatherproof roof system" },
  electrical: { file: "real/electrical.jpg", alt: "Electrical cables prepared for a concealed wall installation" },
  bath: { file: "real/bath.jpg", alt: "Chrome basin faucet installed in a finished bathroom" },
  openings: { file: "real/openings.jpg", alt: "Professional installer fitting a modern window frame" },
  ceiling: { file: "real/ceiling.jpg", alt: "Metal framing components prepared for a ceiling installation" },
  tiles: { file: "real/tiles.jpg", alt: "Floor tiles and installation tools at a renovation site" },
  paint: { file: "real/paint.jpg", alt: "Paint bucket, roller and surface-finishing tools on site" },
}

const taxonomy: TaxonomyNode[] = [
  { path: "cement-structure", name: "Cement & Structure", description: "Core structural materials for foundations, masonry and concrete work.", icon: "building-2", asset: "cement" },
  { path: "cement-structure/cement", name: "Cement", parent: "cement-structure", description: "Bagged cement for RCC, masonry and plastering.", icon: "package", asset: "cement" },
  { path: "cement-structure/cement/opc-43", name: "General Purpose (OPC 43)", parent: "cement-structure/cement", description: "General-purpose cement for masonry and plastering.", icon: "package", asset: "cement" },
  { path: "cement-structure/cement/opc-53", name: "High Strength (OPC 53)", parent: "cement-structure/cement", description: "Higher early-strength cement for structural concrete.", icon: "package", asset: "cement" },
  { path: "cement-structure/cement/ppc", name: "Blended / PPC", parent: "cement-structure/cement", description: "Blended cement for durable general construction.", icon: "package", asset: "cement" },
  { path: "cement-structure/blocks-bricks", name: "Blocks & Bricks", parent: "cement-structure", description: "Masonry units for external and internal walls.", icon: "brick-wall", asset: "cement" },
  { path: "cement-structure/blocks-bricks/aac-blocks", name: "AAC Blocks", parent: "cement-structure/blocks-bricks", description: "Lightweight autoclaved aerated concrete blocks.", icon: "brick-wall", asset: "cement" },
  { path: "cement-structure/blocks-bricks/fly-ash-bricks", name: "Fly Ash Bricks", parent: "cement-structure/blocks-bricks", description: "Uniform fly-ash masonry bricks.", icon: "brick-wall", asset: "cement" },
  { path: "cement-structure/aggregates-sand", name: "Aggregates & Sand", parent: "cement-structure", description: "Fine and coarse aggregates for concrete and mortar.", icon: "mountain", asset: "cement" },
  { path: "cement-structure/aggregates-sand/m-sand", name: "Manufactured Sand (M-Sand)", parent: "cement-structure/aggregates-sand", description: "Graded manufactured sand for concrete and masonry.", icon: "mountain", asset: "cement" },

  { path: "steel-tmt", name: "Steel & TMT", description: "Reinforcement and structural steel for foundations, frames and fabrication.", icon: "columns-3", asset: "steel" },
  { path: "steel-tmt/tmt-bars", name: "TMT Steel Bars", parent: "steel-tmt", description: "Ribbed reinforcement bars in common grades and diameters.", icon: "columns-3", asset: "steel" },
  { path: "steel-tmt/tmt-bars/fe500", name: "High Strength (Fe500)", parent: "steel-tmt/tmt-bars", description: "Fe500 reinforcement bars for general structural work.", icon: "columns-3", asset: "steel" },
  { path: "steel-tmt/tmt-bars/fe550", name: "Ultra High Strength (Fe550)", parent: "steel-tmt/tmt-bars", description: "High-strength reinforcement for engineered applications.", icon: "columns-3", asset: "steel" },
  { path: "steel-tmt/binding-wire", name: "Binding Wire", parent: "steel-tmt", description: "Annealed and galvanized wire for reinforcement tying.", icon: "cable", asset: "steel" },
  { path: "steel-tmt/structural-steel", name: "Structural Steel", parent: "steel-tmt", description: "Angles, channels and flats for fabrication.", icon: "ruler", asset: "steel" },
  { path: "steel-tmt/welded-mesh", name: "Welded Wire Mesh", parent: "steel-tmt", description: "Factory-welded reinforcement mesh for slabs and floors.", icon: "grid-3x3", asset: "steel" },

  { path: "waterproofing", name: "Waterproofing", description: "Coatings, membranes and treatments for roofs, walls and wet areas.", icon: "shield-check", asset: "waterproofing" },
  { path: "waterproofing/terrace", name: "Terrace Waterproofing", parent: "waterproofing", description: "Weather-resistant systems for exposed terraces and roofs.", icon: "house", asset: "waterproofing" },
  { path: "waterproofing/bathroom", name: "Bathroom Waterproofing", parent: "waterproofing", description: "Pre-tile coatings and kits for wet areas.", icon: "droplets", asset: "waterproofing" },
  { path: "waterproofing/walls", name: "Wall Waterproofing", parent: "waterproofing", description: "Anti-seepage and damp-proof wall treatments.", icon: "shield-check", asset: "waterproofing" },
  { path: "waterproofing/sealants", name: "Joint & Gap Sealants", parent: "waterproofing", description: "Flexible sealants for construction joints and service gaps.", icon: "paintbrush", asset: "waterproofing" },

  { path: "electrical", name: "Electrical", description: "Wiring, protection, controls and lighting for residential projects.", icon: "zap", asset: "electrical" },
  { path: "electrical/wires-cables", name: "Wires & Cables", parent: "electrical", description: "House wires and flexible cables for power circuits.", icon: "cable", asset: "electrical" },
  { path: "electrical/wires-cables/copper-wires", name: "Copper Wires", parent: "electrical/wires-cables", description: "FR and FRLS copper conductors in common sizes.", icon: "cable", asset: "electrical" },
  { path: "electrical/wires-cables/flexible-cables", name: "Flexible Cables", parent: "electrical/wires-cables", description: "Flexible multi-core cables for equipment and appliances.", icon: "cable", asset: "electrical" },
  { path: "electrical/switches-sockets", name: "Switches & Sockets", parent: "electrical", description: "Modular controls, sockets and plates.", icon: "toggle-right", asset: "electrical" },
  { path: "electrical/switches-sockets/modular", name: "Modular Switches", parent: "electrical/switches-sockets", description: "Modular switches for residential switchboards.", icon: "toggle-right", asset: "electrical" },
  { path: "electrical/protection", name: "Protection & Distribution", parent: "electrical", description: "MCBs, RCCBs and distribution boards.", icon: "shield-alert", asset: "electrical" },
  { path: "electrical/protection/mcb", name: "MCB", parent: "electrical/protection", description: "Miniature circuit breakers for final circuits.", icon: "shield-alert", asset: "electrical" },
  { path: "electrical/lighting", name: "Lighting", parent: "electrical", description: "Efficient lamps and luminaires for homes and sites.", icon: "lightbulb", asset: "electrical" },
  { path: "electrical/lighting/led-battens", name: "Batten Lights", parent: "electrical/lighting", description: "Linear LED battens for rooms and utility spaces.", icon: "lightbulb", asset: "electrical" },

  { path: "sanitaryware-bathware", name: "Sanitaryware & Bathware", description: "Fixtures, faucets and accessories for bathrooms and kitchens.", icon: "bath", asset: "bath" },
  { path: "sanitaryware-bathware/toilets", name: "EWCs & Toilets", parent: "sanitaryware-bathware", description: "Floor-mounted and wall-hung toilet systems.", icon: "bath", asset: "bath" },
  { path: "sanitaryware-bathware/toilets/wall-hung", name: "Wall-Hung Toilets", parent: "sanitaryware-bathware/toilets", description: "Space-saving wall-hung toilets and concealed systems.", icon: "bath", asset: "bath" },
  { path: "sanitaryware-bathware/faucets", name: "Faucets", parent: "sanitaryware-bathware", description: "Basin, kitchen and shower faucets.", icon: "waves", asset: "bath" },
  { path: "sanitaryware-bathware/faucets/basin", name: "Basin Faucets", parent: "sanitaryware-bathware/faucets", description: "Pillar taps and mixers for wash basins.", icon: "waves", asset: "bath" },
  { path: "sanitaryware-bathware/showers", name: "Showers", parent: "sanitaryware-bathware", description: "Overhead and hand shower fittings.", icon: "shower-head", asset: "bath" },
  { path: "sanitaryware-bathware/basins", name: "Wash Basins", parent: "sanitaryware-bathware", description: "Countertop, pedestal and wall-hung basins.", icon: "circle", asset: "bath" },

  { path: "doors-windows", name: "Doors & Windows", description: "Openings, frames, glazing and associated hardware.", icon: "door-open", asset: "openings" },
  { path: "doors-windows/doors", name: "Doors", parent: "doors-windows", description: "Main, internal, bathroom and kitchen doors.", icon: "door-open", asset: "openings" },
  { path: "doors-windows/doors/internal", name: "Internal Doors", parent: "doors-windows/doors", description: "Flush and moulded doors for interior rooms.", icon: "door-open", asset: "openings" },
  { path: "doors-windows/windows", name: "Windows", parent: "doors-windows", description: "uPVC, aluminium and wooden window systems.", icon: "panels-top-left", asset: "openings" },
  { path: "doors-windows/windows/upvc", name: "uPVC Windows", parent: "doors-windows/windows", description: "Low-maintenance uPVC window assemblies.", icon: "panels-top-left", asset: "openings" },
  { path: "doors-windows/hardware", name: "Door Hardware", parent: "doors-windows", description: "Handles, locks, hinges and closers.", icon: "key-round", asset: "openings" },

  { path: "false-ceiling-drywall", name: "False Ceiling & Drywall", description: "Boards, framing and finishing materials for lightweight interiors.", icon: "panel-top", asset: "ceiling" },
  { path: "false-ceiling-drywall/boards", name: "Ceiling & Partition Boards", parent: "false-ceiling-drywall", description: "Gypsum and fibre-cement boards for ceilings and partitions.", icon: "panel-top", asset: "ceiling" },
  { path: "false-ceiling-drywall/boards/gypsum", name: "Gypsum Boards", parent: "false-ceiling-drywall/boards", description: "Standard and moisture-resistant gypsum boards.", icon: "panel-top", asset: "ceiling" },
  { path: "false-ceiling-drywall/framing", name: "Metal Framing", parent: "false-ceiling-drywall", description: "GI studs, tracks and ceiling sections.", icon: "ruler", asset: "ceiling" },
  { path: "false-ceiling-drywall/finishing", name: "Finishing Accessories", parent: "false-ceiling-drywall", description: "Joint compound, tape, beads and screws.", icon: "wrench", asset: "ceiling" },

  { path: "tiles-flooring", name: "Tiles & Flooring", description: "Tiles, natural stone and flooring finishes for indoor and outdoor areas.", icon: "grid-3x3", asset: "tiles" },
  { path: "tiles-flooring/floor-tiles", name: "Floor Tiles", parent: "tiles-flooring", description: "Vitrified, ceramic and porcelain floor tiles.", icon: "grid-3x3", asset: "tiles" },
  { path: "tiles-flooring/floor-tiles/glossy", name: "Glossy Floor Tiles", parent: "tiles-flooring/floor-tiles", description: "Polished and glossy tiles for dry interiors.", icon: "sparkles", asset: "tiles" },
  { path: "tiles-flooring/floor-tiles/anti-skid", name: "Anti-Skid Floor Tiles", parent: "tiles-flooring/floor-tiles", description: "Slip-resistant tiles for bathrooms and utility areas.", icon: "footprints", asset: "tiles" },
  { path: "tiles-flooring/wall-tiles", name: "Wall Tiles", parent: "tiles-flooring", description: "Decorative and functional ceramic wall tiles.", icon: "grid-3x3", asset: "tiles" },
  { path: "tiles-flooring/outdoor", name: "Outdoor Tiles", parent: "tiles-flooring", description: "Durable tiles for parking, terraces and steps.", icon: "trees", asset: "tiles" },
  { path: "tiles-flooring/natural-stone", name: "Natural Stone", parent: "tiles-flooring", description: "Marble and granite for floors, counters and cladding.", icon: "gem", asset: "tiles" },

  { path: "paints-finishing", name: "Paints & Finishing", description: "Interior, exterior and protective finishes for walls, wood and metal.", icon: "paint-bucket", asset: "paint" },
  { path: "paints-finishing/interior", name: "Interior Paints", parent: "paints-finishing", description: "Emulsions and distempers for interior walls and ceilings.", icon: "paint-bucket", asset: "paint" },
  { path: "paints-finishing/interior/emulsion", name: "Interior Emulsion", parent: "paints-finishing/interior", description: "Washable water-based emulsion finishes.", icon: "paint-bucket", asset: "paint" },
  { path: "paints-finishing/exterior", name: "Exterior Paints", parent: "paints-finishing", description: "Weather-resistant coatings for exterior walls.", icon: "house", asset: "paint" },
  { path: "paints-finishing/exterior/emulsion", name: "Exterior Emulsion", parent: "paints-finishing/exterior", description: "Exterior emulsion for masonry façades.", icon: "house", asset: "paint" },
  { path: "paints-finishing/primer", name: "Primer", parent: "paints-finishing", description: "Wall, wood and metal primers for surface preparation.", icon: "paintbrush", asset: "paint" },
  { path: "paints-finishing/texture", name: "Texture Paints", parent: "paints-finishing", description: "Decorative smooth, sand and designer textures.", icon: "brush", asset: "paint" },
  { path: "paints-finishing/wood-metal", name: "Wood & Metal Coatings", parent: "paints-finishing", description: "Enamel, varnish and rust-protection finishes.", icon: "shield", asset: "paint" },
]

const products: DemoProduct[] = [
  { sku:"BLD-CEM-OPC43-50", name:"Buildanta Prime OPC 43 Cement – 50 kg", description:"Demonstration catalogue cement for masonry, plastering and general RCC work.", brand:"Buildanta Core", leaf:"cement-structure/cement/opc-43", asset:"cement", price:365, bulkPrice:348, unit:"50 kg bag", minimumOrder:10, gst:28, stock:180, threshold:30, specs:["OPC 43 grade","50 kg bag","General masonry and plastering","Indicative demo price"], attributes:{grade:"OPC 43",pack:"50 kg"}, alt:"Buildanta Prime OPC 43 cement bag" },
  { sku:"BLD-CEM-OPC53-50", name:"Buildanta Strong OPC 53 Cement – 50 kg", description:"Demonstration high early-strength cement for reinforced concrete work.", brand:"Buildanta Core", leaf:"cement-structure/cement/opc-53", asset:"cement", price:395, bulkPrice:378, unit:"50 kg bag", minimumOrder:10, gst:28, stock:140, threshold:25, specs:["OPC 53 grade","50 kg bag","Structural concrete applications","Indicative demo price"], attributes:{grade:"OPC 53",pack:"50 kg"}, alt:"Buildanta Strong OPC 53 cement bag" },
  { sku:"BLD-BLOCK-AAC-600", name:"Autoclaved AAC Block – 600 × 200 × 150 mm", description:"Lightweight demonstration masonry block for energy-efficient wall construction.", brand:"Buildanta Core", leaf:"cement-structure/blocks-bricks/aac-blocks", asset:"cement", price:92, bulkPrice:86, unit:"piece", minimumOrder:100, gst:12, stock:900, threshold:150, specs:["600 × 200 × 150 mm","Lightweight masonry unit","Low thermal conductivity","Indicative demo price"], attributes:{size:"600 × 200 × 150 mm"}, alt:"Stack of lightweight AAC masonry blocks" },

  { sku:"BLD-TMT-FE500D-12", name:"Fe 500D TMT Steel Bar – 12 mm", description:"High-ductility demonstration reinforcement bar for columns, beams and slabs.", brand:"Buildanta Steel", leaf:"steel-tmt/tmt-bars/fe500", asset:"steel", price:62, bulkPrice:59, unit:"kg", minimumOrder:100, gst:18, stock:4800, threshold:500, specs:["Fe500D grade","12 mm diameter","High-bond ribs","Indicative demo price per kg"], attributes:{grade:"Fe500D",diameter:"12 mm"}, alt:"Fe500D 12 mm TMT reinforcement steel bars" },
  { sku:"BLD-TMT-FE550-16", name:"Fe 550 TMT Steel Bar – 16 mm", description:"High-strength demonstration reinforcement for engineered structural applications.", brand:"Buildanta Steel", leaf:"steel-tmt/tmt-bars/fe550", asset:"steel", price:66, bulkPrice:63, unit:"kg", minimumOrder:100, gst:18, stock:3100, threshold:400, specs:["Fe550 grade","16 mm diameter","Ribbed reinforcement","Indicative demo price per kg"], attributes:{grade:"Fe550",diameter:"16 mm"}, alt:"Fe550 16 mm TMT reinforcement steel bars" },
  { sku:"BLD-MESH-SLAB-4", name:"Welded Slab Reinforcement Mesh – 4 mm", description:"Factory-welded demonstration mesh for screeds, floors and light slabs.", brand:"Buildanta Steel", leaf:"steel-tmt/welded-mesh", asset:"steel", price:1380, bulkPrice:1290, unit:"sheet", minimumOrder:5, gst:18, stock:65, threshold:12, specs:["4 mm wire","Factory-welded grid","Floor and screed reinforcement","Indicative demo price"], attributes:{wire:"4 mm",format:"sheet"}, alt:"Welded steel reinforcement mesh sheet" },

  { sku:"BLD-WP-TERRACE-20", name:"Terrace Waterproofing Coating – 20 L", description:"Flexible demonstration waterproof coating for exposed terraces and roofs.", brand:"Buildanta Shield", leaf:"waterproofing/terrace", asset:"waterproofing", price:4280, bulkPrice:3990, unit:"20 L pail", minimumOrder:1, gst:18, stock:28, threshold:6, specs:["20 litre pail","Flexible acrylic coating","Terrace and roof application","Indicative demo price"], attributes:{pack:"20 L",application:"Terrace"}, alt:"Terrace waterproofing coating pail and roller" },
  { sku:"BLD-WP-BATH-10", name:"Bathroom Pre-Tile Waterproofing Kit – 10 kg", description:"Demonstration two-coat waterproofing system for bathrooms before tiling.", brand:"Buildanta Shield", leaf:"waterproofing/bathroom", asset:"waterproofing", price:1890, bulkPrice:1760, unit:"10 kg kit", minimumOrder:1, gst:18, stock:34, threshold:8, specs:["10 kg kit","For wet areas before tiling","Brush-applied system","Indicative demo price"], attributes:{pack:"10 kg",application:"Bathroom"}, alt:"Bathroom waterproofing coating kit" },
  { sku:"BLD-SEAL-PU-600", name:"PU Construction Joint Sealant – 600 ml", description:"Flexible demonstration polyurethane sealant for façade and construction joints.", brand:"Buildanta Shield", leaf:"waterproofing/sealants", asset:"waterproofing", price:485, bulkPrice:445, unit:"600 ml sausage", minimumOrder:12, gst:18, stock:96, threshold:20, specs:["600 ml pack","Polyurethane sealant","Movement-joint application","Indicative demo price"], attributes:{pack:"600 ml",chemistry:"PU"}, alt:"Construction waterproofing sealant pack" },

  { sku:"BLD-WIRE-FRLS-15", name:"FRLS Copper House Wire – 1.5 sq mm / 90 m", description:"Flame-retardant low-smoke demonstration copper wire for lighting circuits.", brand:"Buildanta Electrical", leaf:"electrical/wires-cables/copper-wires", asset:"electrical", price:1580, bulkPrice:1495, unit:"90 m coil", minimumOrder:1, gst:18, stock:42, threshold:10, specs:["1.5 sq mm conductor","90 metre coil","FRLS insulation","Indicative demo price"], attributes:{size:"1.5 sq mm",length:"90 m",insulation:"FRLS"}, alt:"FRLS insulated copper house wire coil" },
  { sku:"BLD-SWITCH-10A-1W", name:"Modular 10A One-Way Switch", description:"Compact demonstration modular switch for residential lighting control.", brand:"Buildanta Electrical", leaf:"electrical/switches-sockets/modular", asset:"electrical", price:128, bulkPrice:112, unit:"piece", minimumOrder:10, gst:18, stock:240, threshold:40, specs:["10A rating","One-way mechanism","Modular format","Indicative demo price"], attributes:{rating:"10A",type:"One-way"}, alt:"White modular one-way electrical switch" },
  { sku:"BLD-LED-BATTEN-20", name:"LED Batten Light – 20W", description:"Efficient demonstration linear LED batten for rooms and utility areas.", brand:"Buildanta Electrical", leaf:"electrical/lighting/led-battens", asset:"electrical", price:620, bulkPrice:570, unit:"piece", minimumOrder:4, gst:12, stock:58, threshold:12, specs:["20W power","Cool daylight","Linear surface mounting","Indicative demo price"], attributes:{power:"20W",colour:"Cool daylight"}, alt:"20 watt LED batten light fitting" },

  { sku:"BLD-FAUCET-MIX-CHR", name:"Chrome Basin Mixer", description:"Demonstration single-lever basin mixer with a polished chrome finish.", brand:"Buildanta Bath", leaf:"sanitaryware-bathware/faucets/basin", asset:"bath", price:3490, bulkPrice:3190, unit:"piece", minimumOrder:1, gst:18, stock:18, threshold:4, specs:["Single-lever mixer","Chrome finish","Ceramic cartridge","Indicative demo price"], attributes:{finish:"Chrome",mounting:"Deck mounted"}, alt:"Polished chrome basin mixer faucet" },
  { sku:"BLD-EWC-WH-RIMLESS", name:"Wall-Hung Rimless Toilet", description:"Space-saving demonstration rimless wall-hung toilet for concealed cistern systems.", brand:"Buildanta Bath", leaf:"sanitaryware-bathware/toilets/wall-hung", asset:"bath", price:12400, bulkPrice:11600, unit:"set", minimumOrder:1, gst:18, stock:9, threshold:3, specs:["Wall-hung format","Rimless bowl","Soft-close seat","Indicative demo price"], attributes:{type:"Wall-hung",flush:"Rimless"}, alt:"White wall-hung rimless toilet" },
  { sku:"BLD-SHOWER-RND-200", name:"Overhead Rain Shower – 200 mm", description:"Demonstration stainless-steel overhead shower for contemporary bathrooms.", brand:"Buildanta Bath", leaf:"sanitaryware-bathware/showers", asset:"bath", price:2290, bulkPrice:2090, unit:"piece", minimumOrder:1, gst:18, stock:21, threshold:5, specs:["200 mm face","Stainless-steel body","Easy-clean nozzles","Indicative demo price"], attributes:{size:"200 mm",finish:"Chrome"}, alt:"Round chrome overhead rain shower" },

  { sku:"BLD-WIN-UPVC-1212", name:"uPVC Sliding Window – 1200 × 1200 mm", description:"Demonstration two-track uPVC sliding window with clear glazing.", brand:"Buildanta Openings", leaf:"doors-windows/windows/upvc", asset:"openings", price:7850, bulkPrice:7400, unit:"unit", minimumOrder:1, gst:18, stock:12, threshold:3, specs:["1200 × 1200 mm","Two-track sliding","Clear glass","Indicative demo price"], attributes:{size:"1200 × 1200 mm",material:"uPVC"}, alt:"White two-panel uPVC sliding window" },
  { sku:"BLD-DOOR-FLUSH-2100", name:"Laminated Flush Door – 2100 × 900 mm", description:"Demonstration factory-finished flush door shutter for interior rooms.", brand:"Buildanta Openings", leaf:"doors-windows/doors/internal", asset:"openings", price:6480, bulkPrice:6100, unit:"shutter", minimumOrder:1, gst:18, stock:16, threshold:4, specs:["2100 × 900 mm","30 mm thickness","Laminate finish","Indicative demo price"], attributes:{size:"2100 × 900 mm",thickness:"30 mm"}, alt:"Laminated interior flush door shutter" },
  { sku:"BLD-LOCK-MORTISE-60", name:"Mortise Lock Set – 60 mm", description:"Demonstration mortise lock set with lever handles for interior doors.", brand:"Buildanta Openings", leaf:"doors-windows/hardware", asset:"openings", price:1850, bulkPrice:1690, unit:"set", minimumOrder:2, gst:18, stock:26, threshold:6, specs:["60 mm lock body","Lever handle pair","Interior door use","Indicative demo price"], attributes:{backset:"60 mm",finish:"Satin"}, alt:"Mortise door lock and lever handle set" },

  { sku:"BLD-GYP-STD-125", name:"Standard Gypsum Board – 12.5 mm", description:"Demonstration gypsum board for interior false ceilings and drywall partitions.", brand:"Buildanta Ceiling", leaf:"false-ceiling-drywall/boards/gypsum", asset:"ceiling", price:465, bulkPrice:438, unit:"board", minimumOrder:10, gst:18, stock:125, threshold:25, specs:["12.5 mm thickness","1200 × 2400 mm","Ceiling and partition use","Indicative demo price"], attributes:{thickness:"12.5 mm",size:"1200 × 2400 mm"}, alt:"Stack of standard gypsum drywall boards" },
  { sku:"BLD-GI-CHANNEL-3660", name:"GI Ceiling Section – 3660 mm", description:"Galvanized demonstration metal section for suspended ceiling frameworks.", brand:"Buildanta Ceiling", leaf:"false-ceiling-drywall/framing", asset:"ceiling", price:215, bulkPrice:198, unit:"length", minimumOrder:20, gst:18, stock:190, threshold:35, specs:["3660 mm length","Galvanized steel","Suspended ceiling framing","Indicative demo price"], attributes:{length:"3660 mm",material:"GI"}, alt:"Galvanized ceiling framing channel" },
  { sku:"BLD-JOINT-COMP-20", name:"Drywall Joint Compound – 20 kg", description:"Demonstration ready-mix compound for gypsum-board joints and finishing.", brand:"Buildanta Ceiling", leaf:"false-ceiling-drywall/finishing", asset:"ceiling", price:920, bulkPrice:860, unit:"20 kg pail", minimumOrder:1, gst:18, stock:37, threshold:8, specs:["20 kg pail","Ready-mix compound","Joint and finishing application","Indicative demo price"], attributes:{pack:"20 kg",type:"Ready mix"}, alt:"Drywall joint compound pail with gypsum boards" },

  { sku:"BLD-TILE-CARRARA-612", name:"Carrara Vitrified Floor Tile – 600 × 1200 mm", description:"Demonstration marble-look vitrified tile for premium dry interiors.", brand:"Buildanta Surfaces", leaf:"tiles-flooring/floor-tiles/glossy", asset:"tiles", price:1180, bulkPrice:1090, unit:"box", minimumOrder:5, gst:18, stock:76, threshold:15, specs:["600 × 1200 mm","Glossy marble look","Low water absorption","Indicative demo price per box"], attributes:{size:"600 × 1200 mm",finish:"Glossy"}, alt:"Carrara marble-look vitrified floor tile" },
  { sku:"BLD-TILE-ANTISKID-303", name:"Anti-Skid Bathroom Tile – 300 × 300 mm", description:"Demonstration slip-resistant ceramic tile for bathroom and utility floors.", brand:"Buildanta Surfaces", leaf:"tiles-flooring/floor-tiles/anti-skid", asset:"tiles", price:720, bulkPrice:665, unit:"box", minimumOrder:4, gst:18, stock:84, threshold:16, specs:["300 × 300 mm","Anti-skid finish","Wet-area floor use","Indicative demo price per box"], attributes:{size:"300 × 300 mm",finish:"Anti-skid"}, alt:"Textured anti-skid bathroom floor tile" },
  { sku:"BLD-TILE-WALL-306", name:"Satin White Wall Tile – 300 × 600 mm", description:"Demonstration satin-finish ceramic wall tile for kitchens and bathrooms.", brand:"Buildanta Surfaces", leaf:"tiles-flooring/wall-tiles", asset:"tiles", price:690, bulkPrice:635, unit:"box", minimumOrder:4, gst:18, stock:92, threshold:18, specs:["300 × 600 mm","Satin finish","Kitchen and bathroom walls","Indicative demo price per box"], attributes:{size:"300 × 600 mm",finish:"Satin"}, alt:"Satin white ceramic wall tiles" },

  { sku:"BLD-PAINT-INT-20", name:"Interior Luxury Emulsion – 20 L", description:"Demonstration washable interior emulsion with a smooth low-sheen finish.", brand:"Buildanta Finish", leaf:"paints-finishing/interior/emulsion", asset:"paint", price:5490, bulkPrice:5150, unit:"20 L pail", minimumOrder:1, gst:18, stock:31, threshold:7, specs:["20 litre pail","Low-sheen finish","Washable interior coating","Indicative demo price"], attributes:{pack:"20 L",finish:"Low sheen"}, alt:"Interior luxury emulsion paint pail and roller" },
  { sku:"BLD-PAINT-EXT-20", name:"Exterior Weatherproof Emulsion – 20 L", description:"Demonstration exterior coating formulated for masonry weather exposure.", brand:"Buildanta Finish", leaf:"paints-finishing/exterior/emulsion", asset:"paint", price:6290, bulkPrice:5890, unit:"20 L pail", minimumOrder:1, gst:18, stock:24, threshold:6, specs:["20 litre pail","Exterior masonry use","Weather-resistant finish","Indicative demo price"], attributes:{pack:"20 L",application:"Exterior"}, alt:"Exterior weatherproof emulsion paint pail" },
  { sku:"BLD-PRIMER-WALL-20", name:"Acrylic Wall Primer – 20 L", description:"Demonstration water-based wall primer for prepared interior masonry surfaces.", brand:"Buildanta Finish", leaf:"paints-finishing/primer", asset:"paint", price:2890, bulkPrice:2690, unit:"20 L pail", minimumOrder:1, gst:18, stock:39, threshold:8, specs:["20 litre pail","Water-based primer","Interior wall preparation","Indicative demo price"], attributes:{pack:"20 L",base:"Water"}, alt:"Acrylic wall primer pail with paint roller" },
]

function slugify(value: string) { return value.toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") }

function stageFor(definition: DemoProduct) {
  if (definition.asset === "cement") return definition.leaf.includes("blocks-bricks") ? "Walls & Masonry" : "Foundation & Structure"
  if (definition.asset === "steel") return "Foundation & Structure"
  if (definition.asset === "waterproofing") return "Plastering & Waterproofing"
  if (definition.asset === "electrical") return "Electrical & Wiring"
  if (definition.asset === "bath") return "Bathroom & Plumbing"
  if (definition.asset === "openings") return "Doors, Windows, Railings & Glass"
  if (definition.asset === "ceiling") return "False Ceiling"
  if (definition.asset === "tiles") return "Flooring & Tiling"
  return "Paint & Finishing"
}

function roomsFor(definition: DemoProduct) {
  if (definition.asset === "bath") return ["Bathroom"]
  if (definition.asset === "waterproofing") return definition.leaf.includes("bathroom") ? ["Bathroom"] : ["Balcony & Terrace"]
  if (definition.asset === "electrical") return ["Living room", "Bedroom", "Kitchen"]
  if (definition.asset === "openings" || definition.asset === "ceiling" || definition.asset === "paint") return ["Living room", "Bedroom"]
  if (definition.asset === "tiles") return definition.leaf.includes("anti-skid") ? ["Bathroom", "Balcony & Terrace"] : ["Living room", "Kitchen"]
  return []
}

async function main() {
  if (process.env.ALLOW_DEMO_SEED !== "I_UNDERSTAND") {
    throw new Error("Demo catalogue seeding is disabled for the real-data workspace. Set ALLOW_DEMO_SEED=I_UNDERSTAND only in a disposable development database.")
  }
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !secretKey) throw new Error("Supabase URL and server secret key are required.")
  const storage = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const bucket = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET ?? "ProductPhotos"
  const assetDir = path.resolve(process.cwd(), "../../../public/demo/products")
  const { error: bucketError } = await storage.storage.updateBucket(bucket, { public: true })
  if (bucketError) throw new Error(`Could not configure ${bucket}: ${bucketError.message}`)

  const imageUrls = new Map<AssetKey, string>()
  for (const [key, asset] of Object.entries(assets) as [AssetKey, typeof assets[AssetKey]][]) {
    const objectPath = `catalogue-foundation/${asset.file}`
    const { error } = await storage.storage.from(bucket).upload(objectPath, await readFile(path.join(assetDir, asset.file)), { contentType:asset.file.endsWith(".jpg") ? "image/jpeg" : "image/png", cacheControl:"31536000", upsert:true })
    if (error) throw new Error(`Unable to upload ${asset.file}: ${error.message}`)
    imageUrls.set(key, storage.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl)
  }

  const canonicalIds: string[] = []
  const categoryIds = new Map<string, string>()
  for (const [sortOrder, node] of taxonomy.entries()) {
    const parentId: string | null = node.parent ? (categoryIds.get(node.parent) ?? null) : null
    if (node.parent && !parentId) throw new Error(`Missing canonical parent ${node.parent}`)
    const bySlug = await prisma.category.findUnique({ where: { slug: node.path } })
    const byPosition = bySlug ?? await prisma.category.findFirst({ where: { name: node.name, parentId } })
    const data = { name:node.name, slug:node.path, parentId, description:node.description, imageUrl:imageUrls.get(node.asset), icon:node.icon, sortOrder, featured:!node.parent, published:true, seoTitle:`${node.name} | Buildanta`, seoDescription:node.description }
    const saved = byPosition ? await prisma.category.update({ where:{id:byPosition.id}, data }) : await prisma.category.create({ data })
    categoryIds.set(node.path, saved.id); canonicalIds.push(saved.id)
  }

  await prisma.category.updateMany({ where:{ id:{ notIn:canonicalIds } }, data:{ published:false, featured:false } })
  for (let pass=0; pass<3; pass++) {
    const invalid = await prisma.category.findMany({ where:{ name:{ in:["1","2"] } }, include:{ _count:{ select:{ children:true, products:true } } } })
    for (const node of invalid) if (node._count.children===0 && node._count.products===0) await prisma.category.delete({ where:{id:node.id} })
  }

  const supplier = await prisma.supplier.upsert({ where:{email:"demo.catalog@buildanta.local"}, update:{name:"Buildanta Demonstration Supply",contactInfo:"Demonstration catalogue supplier; replace with an approved supplier before production."}, create:{name:"Buildanta Demonstration Supply",email:"demo.catalog@buildanta.local",contactInfo:"Demonstration catalogue supplier; replace with an approved supplier before production."} })
  const stagesByName = new Map((await prisma.stage.findMany({where:{parentId:null}})).map((stage)=>[stage.name,stage.id]))
  const roomsByName = new Map((await prisma.room.findMany()).map((room)=>[room.name,room.id]))
  const productIds: string[] = []
  for (const definition of products) {
    const categoryId = categoryIds.get(definition.leaf)
    if (!categoryId) throw new Error(`Unknown product leaf category ${definition.leaf}`)
    const brandSlug = slugify(definition.brand)
    const brand = await prisma.brand.upsert({ where:{slug:brandSlug}, update:{name:definition.brand,description:"Buildanta demonstration catalogue brand."}, create:{name:definition.brand,slug:brandSlug,description:"Buildanta demonstration catalogue brand."} })
    const existing = await prisma.productVariant.findUnique({ where:{sku:definition.sku}, select:{id:true,productId:true} })
    const stageId = stagesByName.get(stageFor(definition))
    if (!stageId) throw new Error(`Missing construction stage ${stageFor(definition)}`)
    const roomIds = roomsFor(definition).map((name)=>roomsByName.get(name)).filter((id):id is string=>Boolean(id))
    const productData = { name:definition.name, description:`${definition.description} Prices are indicative demonstration pricing, not live market quotations.`, keySpecifications:definition.specs, brandId:brand.id, sellingPrice:definition.price, bulkPrice:definition.bulkPrice, gstPercent:definition.gst, unit:definition.unit, minimumOrderQuantity:definition.minimumOrder, deliveryInfo:"Delivery schedule and transportation are confirmed after PIN-code review.", status:ProductStatus.PUBLISHED, publishedAt:new Date() }
    const product = existing
      ? await prisma.product.update({where:{id:existing.productId},data:{...productData,categories:{set:[{id:categoryId}]},stages:{set:[{id:stageId}]},rooms:{set:roomIds.map((id)=>({id}))}}})
      : await prisma.product.create({data:{...productData,categories:{connect:[{id:categoryId}]},stages:{connect:[{id:stageId}]},rooms:{connect:roomIds.map((id)=>({id}))},variants:{create:{sku:definition.sku,price:definition.price,attributes:definition.attributes,unit:definition.unit,minimumOrderQuantity:definition.minimumOrder,stockQuantity:definition.stock,reservedQuantity:0,lowStockThreshold:definition.threshold,stockTracked:true,status:VariantStatus.ACTIVE,supplierId:supplier.id}}}})
    const variant = await prisma.productVariant.findUniqueOrThrow({where:{sku:definition.sku}})
    await prisma.productVariant.update({where:{id:variant.id},data:{price:definition.price,attributes:definition.attributes,unit:definition.unit,minimumOrderQuantity:definition.minimumOrder,stockQuantity:definition.stock,lowStockThreshold:definition.threshold,stockTracked:true,status:VariantStatus.ACTIVE,supplierId:supplier.id}})
    const imageUrl = imageUrls.get(definition.asset)!
    const currentImage = await prisma.productImage.findFirst({where:{productId:product.id,primary:true}}) ?? await prisma.productImage.findFirst({where:{productId:product.id}})
    if (currentImage) await prisma.productImage.update({where:{id:currentImage.id},data:{src:imageUrl,alt:definition.alt,variantId:variant.id,primary:true,sortOrder:0}})
    else await prisma.productImage.create({data:{src:imageUrl,alt:definition.alt,productId:product.id,variantId:variant.id,primary:true,sortOrder:0}})
    productIds.push(product.id)
  }

  const sample = await prisma.productVariant.findUnique({ where:{sku:"BLD-SAMPLE-001"}, select:{productId:true} })
  const floorLeaf = categoryIds.get("tiles-flooring/floor-tiles/glossy")
  if (sample && floorLeaf) await prisma.product.update({ where:{id:sample.productId}, data:{categories:{set:[{id:floorLeaf}]},status:ProductStatus.DRAFT} })

  for (const [sortOrder, productId] of productIds.slice(0,12).entries()) {
    await prisma.homepageProduct.upsert({where:{productId},update:{sortOrder,badge:sortOrder<3?"Demo catalogue":null},create:{productId,sortOrder,badge:sortOrder<3?"Demo catalogue":null}})
  }
  console.log(JSON.stringify({canonicalCategories:canonicalIds.length,demoProducts:productIds.length,durableAssets:imageUrls.size,invalidNumericNodesRemaining:await prisma.category.count({where:{name:{in:["1","2"]}}})},null,2))
}

main().catch((error)=>{console.error(error);process.exitCode=1}).finally(async()=>prisma.$disconnect())
