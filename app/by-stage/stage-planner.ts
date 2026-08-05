import type { StoreProduct } from "../live-catalog";

export type QualityTier = "ECONOMY" | "STANDARD" | "PREMIUM";

export type StageAnswers = {
  builtUpAreaSqFt: number;
  floors: number;
  rooms: number;
  bathrooms: number;
  kitchens: number;
  projectType: "RESIDENTIAL" | "COMMERCIAL";
  structureSystem: "RCC_FRAME" | "LOAD_BEARING";
  qualityTier: QualityTier;
  coveragePercent: number;
  wastagePercent: number;
};

export type StageQuestionProfile = {
  coverageLabel: string;
  coverageHelp: string;
  defaultCoverage: number;
};

export type StagePlanLine = {
  key: string;
  material: string;
  requirement: number;
  purchaseQuantity: number;
  unit: string;
  product: StoreProduct | null;
  planningRate: number | null;
  lineTotal: number | null;
  note: string;
};

export type StagePlan = {
  stage: string;
  basisAreaSqFt: number;
  mappedLines: number;
  totalLines: number;
  indicativeTotal: number;
  lines: StagePlanLine[];
  assumptions: string[];
};

type MaterialDraft = {
  key: string;
  material: string;
  requirement: number;
  unit: string;
  productTerms?: string[];
  note: string;
};

const SQFT_TO_SQM = 0.092903;

const stageProfiles: Record<string, StageQuestionProfile> = {
  "Foundation & Structure": { coverageLabel: "Foundation footprint coverage", coverageHelp: "Usually 100% of the floor plate. Reduce only for partial or extension work.", defaultCoverage: 100 },
  "Walls & Masonry": { coverageLabel: "Wall-work coverage", coverageHelp: "Percentage of the complete building wall work included in this purchase.", defaultCoverage: 100 },
  "Bathroom & Plumbing": { coverageLabel: "Plumbing fit-out coverage", coverageHelp: "Use 100% for all listed bathrooms and kitchens.", defaultCoverage: 100 },
  "Electrical & Wiring": { coverageLabel: "Electrical fit-out coverage", coverageHelp: "Use 100% for complete concealed wiring and final fixtures.", defaultCoverage: 100 },
  "Plastering & Waterproofing": { coverageLabel: "Terrace and wet-area coverage", coverageHelp: "Planning percentage of built-up area requiring waterproofing treatment.", defaultCoverage: 30 },
  "Flooring & Tiling": { coverageLabel: "Floor area to tile", coverageHelp: "Include only areas receiving tiles; wet-area wall tiles are added separately.", defaultCoverage: 80 },
  "False Ceiling": { coverageLabel: "Ceiling area coverage", coverageHelp: "Percentage of the total floor area receiving a false ceiling.", defaultCoverage: 60 },
  "Paint & Finishing": { coverageLabel: "Surface finishing coverage", coverageHelp: "Use 100% for a complete interior and exterior painting allowance.", defaultCoverage: 100 },
  "Doors, Windows, Railings & Glass": { coverageLabel: "Opening-package coverage", coverageHelp: "Use 100% when all rooms and external openings are included.", defaultCoverage: 100 },
  "Kitchen & Wardrobes": { coverageLabel: "Joinery-package coverage", coverageHelp: "Use 100% for all listed kitchens and room wardrobes.", defaultCoverage: 100 },
  Finishing: { coverageLabel: "Final finishing coverage", coverageHelp: "Percentage of the project receiving final accessories, sealants and touch-up work.", defaultCoverage: 100 },
};

const fallbackProfile: StageQuestionProfile = {
  coverageLabel: "Stage coverage",
  coverageHelp: "Percentage of the project included in this stage estimate.",
  defaultCoverage: 100,
};

export function getStageQuestionProfile(stage: string) {
  return stageProfiles[stage] ?? fallbackProfile;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function withWastage(value: number, wastagePercent: number) {
  return value * (1 + wastagePercent / 100);
}

function findProduct(products: StoreProduct[], terms: string[] | undefined) {
  if (!terms?.length) return null;
  return products.find((product) => {
    const searchable = `${product.name} ${product.category} ${product.specs.join(" ")}`.toLowerCase();
    return terms.some((term) => searchable.includes(term));
  }) ?? null;
}

function materialDrafts(stage: string, answers: StageAnswers): MaterialDraft[] {
  const floorPlate = answers.builtUpAreaSqFt;
  const totalBuiltUp = floorPlate * answers.floors;
  const coverage = answers.coveragePercent / 100;
  const coveredArea = totalBuiltUp * coverage;
  const waste = answers.wastagePercent;
  const commercialFactor = answers.projectType === "COMMERCIAL" ? 1.08 : 1;
  const loadBearingFactor = answers.structureSystem === "LOAD_BEARING" ? 0.72 : 1;
  const addWaste = (value: number) => withWastage(value * commercialFactor, waste);

  if (stage === "Foundation & Structure") {
    const loadFactor = 1 + Math.max(0, answers.floors - 1) * 0.2;
    const cement = floorPlate * coverage * 0.18 * loadFactor;
    const tmt = floorPlate * coverage * 1.5 * loadFactor * loadBearingFactor;
    return [
      { key: "cement", material: "OPC 53 cement", requirement: addWaste(cement), unit: "50 kg bags", productTerms: ["opc 53"], note: "Preliminary RCC foundation allowance." },
      { key: "tmt", material: "TMT reinforcement steel", requirement: addWaste(tmt), unit: "kg", productTerms: ["tmt reinforcement"], note: "Final bar bending schedule requires structural drawings." },
      { key: "binding-wire", material: "Annealed binding wire", requirement: addWaste(tmt * 0.012), unit: "kg", productTerms: ["binding wire"], note: "Planning allowance based on reinforcement weight." },
      { key: "sand", material: "Construction sand", requirement: addWaste(floorPlate * coverage * 0.01 * loadFactor), unit: "m³", note: "Supplier and grading mapping pending." },
      { key: "aggregate", material: "20 mm coarse aggregate", requirement: addWaste(floorPlate * coverage * 0.014 * loadFactor), unit: "m³", note: "Supplier and grading mapping pending." },
    ];
  }

  if (stage === "Walls & Masonry") {
    const wallFaceSqFt = coveredArea * (answers.structureSystem === "LOAD_BEARING" ? 2.9 : 2.5);
    return [
      { key: "aac", material: "AAC masonry blocks", requirement: addWaste(wallFaceSqFt / 1.292), unit: "pieces", productTerms: ["aac block"], note: "Based on a nominal 600 × 200 mm block face." },
      { key: "masonry-cement", material: "Cement for masonry mortar", requirement: addWaste(wallFaceSqFt * 0.018), unit: "50 kg bags", productTerms: ["portland pozzolana"], note: "Preliminary mortar allowance." },
      { key: "masonry-sand", material: "Sand for masonry mortar", requirement: addWaste(wallFaceSqFt * 0.00075), unit: "m³", note: "Confirm mortar mix and local sand grading." },
    ];
  }

  if (stage === "Bathroom & Plumbing") {
    const fixtureFactor = Math.max(0.1, coverage);
    return [
      { key: "wc", material: "Wall-hung water closet sets", requirement: addWaste(answers.bathrooms * fixtureFactor), unit: "sets", productTerms: ["water closet"], note: "One WC allowance per bathroom." },
      { key: "basin", material: "Basin mixer sets", requirement: addWaste(answers.bathrooms * fixtureFactor), unit: "pieces", productTerms: ["basin mixer"], note: "One basin-mixer allowance per bathroom." },
      { key: "shower", material: "Overhead shower sets", requirement: addWaste(answers.bathrooms * fixtureFactor), unit: "pieces", productTerms: ["overhead shower"], note: "One shower allowance per bathroom." },
      { key: "plumbing-pipe", material: "Water-supply and drainage pipe", requirement: addWaste((answers.bathrooms * 18 + answers.kitchens * 10) * fixtureFactor), unit: "m", note: "Diameter and route must be confirmed from plumbing drawings." },
    ];
  }

  if (stage === "Electrical & Wiring") {
    const wireMetres = coveredArea * 1.6;
    return [
      { key: "wire", material: "FR-LF copper house wire", requirement: Math.ceil(addWaste(wireMetres) / 90), unit: "90 m coils", productTerms: ["house wire"], note: `${Math.ceil(addWaste(wireMetres))} m combined planning route before circuit-size segregation.` },
      { key: "switches", material: "Modular switches", requirement: addWaste(answers.rooms * 5 + answers.kitchens * 4 + answers.bathrooms * 2), unit: "pieces", productTerms: ["modular switch"], note: "Planning point schedule; sockets and specialty controls are confirmed later." },
      { key: "mcb", material: "Miniature circuit breakers", requirement: addWaste(Math.max(4, Math.ceil(coveredArea / 250) + answers.floors)), unit: "pieces", productTerms: ["circuit breaker"], note: "Final ratings require a connected-load schedule." },
      { key: "lighting", material: "LED battens", requirement: addWaste(answers.rooms + answers.kitchens + answers.bathrooms), unit: "pieces", productTerms: ["led batten"], note: "One base light allowance per listed room." },
      { key: "conduit", material: "Heavy PVC conduit", requirement: addWaste(coveredArea * 0.45), unit: "m", note: "Route length and diameter require electrical drawings." },
    ];
  }

  if (stage === "Plastering & Waterproofing") {
    const treatmentAreaSqM = coveredArea * SQFT_TO_SQM;
    return [
      { key: "roofseal", material: "Terrace waterproof coating", requirement: addWaste(treatmentAreaSqM / 40), unit: "20 L pails", productTerms: ["roofseal"], note: "Assumes approximately 40 m² planning coverage per pail for the managed coating system." },
      { key: "bathseal", material: "Bathroom waterproofing kits", requirement: addWaste(answers.bathrooms), unit: "kits", productTerms: ["bathseal"], note: "One preliminary kit allowance per bathroom." },
      { key: "sealant", material: "Construction joint sealant", requirement: addWaste(Math.max(1, treatmentAreaSqM / 18)), unit: "600 ml packs", productTerms: ["polyurethane sealant"], note: "Joint length and depth must be measured before ordering." },
      { key: "plaster", material: "Internal/external plaster system", requirement: addWaste(coveredArea * 2.5), unit: "sq ft", note: "Cement and sand mix depends on substrate and specification." },
    ];
  }

  if (stage === "Flooring & Tiling") {
    const floorSqM = coveredArea * SQFT_TO_SQM;
    const wetFloorSqM = answers.bathrooms * 4;
    const wetWallSqM = answers.bathrooms * 18 + answers.kitchens * 12;
    return [
      { key: "floor-tile", material: "Glazed vitrified floor tiles", requirement: addWaste(floorSqM / 1.44), unit: "boxes", productTerms: ["glazed vitrified"], note: "Uses a 1.44 m² planning box coverage; confirm the selected SKU." },
      { key: "anti-skid", material: "Anti-skid wet-area tiles", requirement: addWaste(wetFloorSqM / 1.44), unit: "boxes", productTerms: ["anti-skid"], note: "Bathroom and utility floor allowance." },
      { key: "wall-tile", material: "Ceramic wall tiles", requirement: addWaste(wetWallSqM / 1.44), unit: "boxes", productTerms: ["ceramic wall tile"], note: "Bathroom and kitchen wall allowance." },
      { key: "adhesive", material: "Tile adhesive", requirement: addWaste((floorSqM + wetFloorSqM + wetWallSqM) * 4), unit: "kg", note: "Confirm adhesive grade for tile size and substrate." },
      { key: "grout", material: "Tile grout", requirement: addWaste((floorSqM + wetFloorSqM + wetWallSqM) * 0.25), unit: "kg", note: "Joint width and tile size affect consumption." },
    ];
  }

  if (stage === "False Ceiling") {
    const ceilingSqM = coveredArea * SQFT_TO_SQM;
    return [
      { key: "board", material: "Gypsum ceiling boards", requirement: addWaste(ceilingSqM / 2.88), unit: "boards", productTerms: ["standard board"], note: "Based on nominal 1200 × 2400 mm boards." },
      { key: "section", material: "GI ceiling sections", requirement: addWaste((ceilingSqM / 2.88) * 3), unit: "lengths", productTerms: ["ceiling section"], note: "Preliminary framework allowance; layout governs final count." },
      { key: "compound", material: "Jointing compound", requirement: addWaste(ceilingSqM / 60), unit: "20 kg bags", productTerms: ["jointing compound"], note: "Use with compatible joint tape and finish system." },
    ];
  }

  if (stage === "Paint & Finishing") {
    const paintableSqM = coveredArea * 3.2 * SQFT_TO_SQM;
    return [
      { key: "interior-paint", material: "Interior luxury emulsion", requirement: addWaste((paintableSqM * 2) / 200), unit: "20 L pails", productTerms: ["royale luxury"], note: "Two-coat planning allowance at 10 m²/L/coat." },
      { key: "exterior-paint", material: "Exterior weather emulsion", requirement: addWaste((paintableSqM * 0.25 * 2) / 200), unit: "20 L pails", productTerms: ["apex ultima"], note: "Indicative exterior share; measure elevations for ordering." },
      { key: "primer", material: "Wall primer", requirement: addWaste(paintableSqM / 240), unit: "20 L pails", productTerms: ["wall primer"], note: "One-coat planning allowance at 12 m²/L." },
      { key: "putty", material: "Wall putty", requirement: addWaste((paintableSqM * 2) / 8), unit: "kg", note: "Two-coat allowance; substrate condition affects consumption." },
    ];
  }

  if (stage === "Doors, Windows, Railings & Glass") {
    const openingFactor = Math.max(0.1, coverage);
    const doors = (answers.rooms + 1) * openingFactor;
    return [
      { key: "doors", material: "Internal flush-door shutters", requirement: addWaste(doors), unit: "shutters", productTerms: ["flush door"], note: "One room door plus entrance allowance; frames priced separately." },
      { key: "windows", material: "uPVC sliding window systems", requirement: addWaste(answers.rooms * 0.8 * openingFactor), unit: "window units", productTerms: ["sliding window"], note: "Final price is based on measured opening area and glazing." },
      { key: "locks", material: "Mortise lock and lever sets", requirement: addWaste(doors), unit: "sets", productTerms: ["mortise lock"], note: "One lockset allowance per door." },
      { key: "railings", material: "Railings and safety-glass package", requirement: addWaste(Math.max(0, answers.floors - 1) * 12 * openingFactor), unit: "running ft", note: "Measure balconies, stairs and terraces before quotation." },
    ];
  }

  if (stage === "Kitchen & Wardrobes") {
    return [
      { key: "kitchen-cabinets", material: "Modular kitchen cabinetry", requirement: addWaste(answers.kitchens * 50 * coverage), unit: "sq ft", note: "Catalogue product mapping pending; final quantity requires a kitchen layout." },
      { key: "countertop", material: "Kitchen countertop", requirement: addWaste(answers.kitchens * 10 * coverage), unit: "running ft", note: "Confirm depth, cut-outs and stone selection." },
      { key: "wardrobes", material: "Bedroom wardrobe shutters and carcass", requirement: addWaste(answers.rooms * 35 * coverage), unit: "sq ft", note: "Catalogue product mapping pending; room measurements required." },
      { key: "joinery-hardware", material: "Joinery hardware sets", requirement: addWaste((answers.rooms + answers.kitchens) * coverage), unit: "sets", note: "Hinges, channels and accessories depend on selected design." },
    ];
  }

  return [
    { key: "skirting", material: "Skirting and edge finishing", requirement: addWaste(Math.sqrt(Math.max(coveredArea, 1)) * 12), unit: "running ft", note: "Preliminary perimeter allowance." },
    { key: "sealants", material: "Final sealant and touch-up allowance", requirement: addWaste(Math.max(1, coveredArea / 250)), unit: "packs", note: "Catalogue product mapping pending." },
    { key: "cleaning", material: "Post-construction cleaning", requirement: addWaste(coveredArea), unit: "sq ft", note: "Area-based service allowance; not a stocked material." },
    { key: "snagging", material: "Final hardware and snagging allowance", requirement: addWaste(answers.rooms + answers.bathrooms + answers.kitchens), unit: "room sets", note: "Confirmed after the final inspection checklist." },
  ];
}

export function buildStagePlan(stage: string, answers: StageAnswers, products: StoreProduct[]): StagePlan {
  const profile = getStageQuestionProfile(stage);
  const normalizedAnswers: StageAnswers = {
    ...answers,
    builtUpAreaSqFt: Math.max(1, answers.builtUpAreaSqFt),
    floors: Math.max(1, Math.round(answers.floors)),
    rooms: Math.max(0, Math.round(answers.rooms)),
    bathrooms: Math.max(0, Math.round(answers.bathrooms)),
    kitchens: Math.max(0, Math.round(answers.kitchens)),
    coveragePercent: Math.min(100, Math.max(1, answers.coveragePercent || profile.defaultCoverage)),
    wastagePercent: Math.min(20, Math.max(0, answers.wastagePercent)),
  };
  const tierFactor = normalizedAnswers.qualityTier === "ECONOMY" ? 0.9 : normalizedAnswers.qualityTier === "PREMIUM" ? 1.2 : 1;
  const drafts = materialDrafts(stage, normalizedAnswers);
  const lines = drafts.map<StagePlanLine>((draft) => {
    const product = findProduct(products, draft.productTerms);
    const requirement = round(Math.max(0, draft.requirement));
    const purchaseQuantity = product
      ? Math.max(product.minimumOrderQuantity, Math.ceil(requirement))
      : round(requirement);
    const planningRate = product?.price ? round(product.price * tierFactor) : null;
    return {
      key: draft.key,
      material: draft.material,
      requirement,
      purchaseQuantity,
      unit: draft.unit,
      product,
      planningRate,
      lineTotal: planningRate == null ? null : round(purchaseQuantity * planningRate),
      note: draft.note,
    };
  });
  const mappedLines = lines.filter((line) => line.product).length;
  const indicativeTotal = round(lines.reduce((total, line) => total + (line.lineTotal ?? 0), 0));
  return {
    stage,
    basisAreaSqFt: round(normalizedAnswers.builtUpAreaSqFt * normalizedAnswers.floors * normalizedAnswers.coveragePercent / 100),
    mappedLines,
    totalLines: lines.length,
    indicativeTotal,
    lines,
    assumptions: [
      `${normalizedAnswers.builtUpAreaSqFt.toLocaleString("en-IN")} sq ft per floor × ${normalizedAnswers.floors} floor(s).`,
      `${normalizedAnswers.coveragePercent}% ${profile.coverageLabel.toLowerCase()} and ${normalizedAnswers.wastagePercent}% wastage.`,
      `${normalizedAnswers.qualityTier.toLowerCase()} quality planning tier; mapped prices are indicative and tier-adjusted.`,
      "Final quantities require approved architectural, structural and MEP drawings plus site measurements.",
    ],
  };
}
