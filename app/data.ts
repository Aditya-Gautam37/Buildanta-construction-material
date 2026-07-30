export type Product = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  stage: string;
  room: string[];
  unit: string;
  price: number;
  stock: number;
  description: string;
  specs: string[];
  tone: string;
};

export const stages = [
  ["▣", "Foundation & Structure"],
  ["▥", "Walls & Masonry"],
  ["⌁", "Bathroom & Plumbing"],
  ["ϟ", "Electrical & Wiring"],
  ["◒", "Plastering & Waterproofing"],
  ["▦", "Flooring & Tiling"],
  ["⌂", "False Ceiling"],
  ["✦", "Paint & Finishing"],
  ["▤", "Doors, Windows, Railings & Glass"],
  ["▱", "Kitchen & Wardrobes"],
] as const;

export const rooms = [
  { name: "Living Room", image: "/livingroom.jpg" },
  { name: "Bedroom", image: "/bedroom.jpg" },
  { name: "Kitchen", image: "/kitchen.jpg" },
  { name: "Bathroom", image: "/bathroom.jpg" },
  { name: "Study / Home Office", image: "/livingroom.jpg" },
  { name: "Balcony & Terrace", image: "/livingroom.jpg" },
] as const;

export const categories = [
  { icon: "ϟ", name: "Electrical", slug: "electrical", blurb: "Wires, switches, lighting and protection" },
  { icon: "◐", name: "Paints", slug: "paints", blurb: "Interior, exterior and specialist coatings" },
  { icon: "▦", name: "Tiles & Flooring", slug: "tiles--flooring", blurb: "Tiles, stone, wood and installation materials" },
  { icon: "♧", name: "Sanitaryware & Bathware", slug: "sanitaryware--bathware", blurb: "Fixtures, faucets, showers and accessories" },
  { icon: "▧", name: "Cement & Structure", slug: "cement--structure", blurb: "Cement, blocks, aggregates and concrete" },
  { icon: "Ⅱ", name: "Steel & TMT", slug: "steel--tmt", blurb: "Reinforcement steel and structural sections" },
  { icon: "◒", name: "Waterproofing", slug: "waterproofing", blurb: "Membranes, compounds and sealants" },
  { icon: "▤", name: "Doors & Windows", slug: "doors--windows", blurb: "Frames, shutters, glass and hardware" },
  { icon: "⌂", name: "False Ceiling & Drywall", slug: "false-ceiling--drywall", blurb: "Boards, channels and ceiling systems" },
] as const;

export const brands = [
  "Havells", "Polycab", "Anchor", "Finolex", "Crompton", "Philips",
  "Asian Paints", "Berger", "Nerolac", "Birla Opus", "Kajaria", "Simpolo",
  "H&R Johnson", "Somany", "Cera", "Hindware", "Parryware", "Jaquar",
  "Kohler", "UltraTech", "ACC", "Shree Cement", "Tata Steel", "JSW Steel",
];

export const products: Product[] = [
  { slug: "ultratech-ppc-cement", name: "UltraTech PPC Cement", brand: "UltraTech", category: "Cement & Structure", categorySlug: "cement--structure", stage: "Foundation & Structure", room: [], unit: "50 kg bag", price: 390, stock: 842, description: "Portland pozzolana cement for durable masonry, plastering and general construction.", specs: ["IS 1489 certified", "50 kg moisture-resistant bag", "Suitable for RCC and masonry"], tone: "sand" },
  { slug: "tata-tiscon-fe550-tmt", name: "Tata Tiscon Fe 550SD TMT Bar", brand: "Tata Steel", category: "Steel & TMT", categorySlug: "steel--tmt", stage: "Foundation & Structure", room: [], unit: "12 mm × 12 m", price: 735, stock: 216, description: "High-strength reinforcement steel engineered for ductility and dependable bonding.", specs: ["Fe 550SD grade", "Earthquake-resistant ductility", "Test certificate available"], tone: "steel" },
  { slug: "polycab-frls-wire", name: "Polycab FRLS House Wire", brand: "Polycab", category: "Electrical", categorySlug: "electrical", stage: "Electrical & Wiring", room: ["Living Room", "Bedroom", "Kitchen"], unit: "90 m coil", price: 1890, stock: 128, description: "Flame-retardant low-smoke copper wire for safer residential electrical installations.", specs: ["1.5 sq mm copper", "FRLS insulation", "ISI marked"], tone: "orange" },
  { slug: "havells-modular-switch", name: "Havells Fabio Modular Switch", brand: "Havells", category: "Electrical", categorySlug: "electrical", stage: "Electrical & Wiring", room: ["Living Room", "Bedroom", "Kitchen"], unit: "10 A switch", price: 168, stock: 440, description: "Clean-profile modular switch with smooth operation and long electrical life.", specs: ["10 AX rated", "ISI compliant", "White finish"], tone: "white" },
  { slug: "asian-paints-royale", name: "Asian Paints Royale Luxury Emulsion", brand: "Asian Paints", category: "Paints", categorySlug: "paints", stage: "Paint & Finishing", room: ["Living Room", "Bedroom"], unit: "20 L bucket", price: 7180, stock: 32, description: "Washable luxury interior emulsion with a smooth, rich finish.", specs: ["High washability", "Low odour", "Soft sheen finish"], tone: "blue" },
  { slug: "berger-weathercoat", name: "Berger WeatherCoat Long Life", brand: "Berger", category: "Paints", categorySlug: "paints", stage: "Paint & Finishing", room: ["Balcony & Terrace"], unit: "20 L bucket", price: 5690, stock: 24, description: "Exterior coating formulated to resist rain, algae and harsh sunlight.", specs: ["Weather protection", "Anti-algal formula", "Multiple shades"], tone: "yellow" },
  { slug: "kajaria-marble-tile", name: "Kajaria Carrara Marble Tile", brand: "Kajaria", category: "Tiles & Flooring", categorySlug: "tiles--flooring", stage: "Flooring & Tiling", room: ["Living Room", "Bedroom"], unit: "600 × 1200 mm", price: 112, stock: 630, description: "Glazed vitrified tile with an elegant Carrara marble surface.", specs: ["Polished finish", "Low water absorption", "Rectified edges"], tone: "marble" },
  { slug: "somany-anti-skid-tile", name: "Somany Anti-Skid Floor Tile", brand: "Somany", category: "Tiles & Flooring", categorySlug: "tiles--flooring", stage: "Flooring & Tiling", room: ["Bathroom", "Balcony & Terrace"], unit: "300 × 300 mm", price: 69, stock: 780, description: "Textured ceramic flooring designed for wet and outdoor spaces.", specs: ["R10 anti-skid", "Matte finish", "Easy maintenance"], tone: "stone" },
  { slug: "jaquar-faucet", name: "Jaquar Florentine Basin Mixer", brand: "Jaquar", category: "Sanitaryware & Bathware", categorySlug: "sanitaryware--bathware", stage: "Bathroom & Plumbing", room: ["Bathroom"], unit: "piece", price: 4890, stock: 18, description: "Chrome-finished basin mixer with smooth ceramic cartridge operation.", specs: ["Chrome finish", "Ceramic cartridge", "10-year warranty"], tone: "chrome" },
  { slug: "cera-wall-hung-wc", name: "Cera Wall Hung WC", brand: "Cera", category: "Sanitaryware & Bathware", categorySlug: "sanitaryware--bathware", stage: "Bathroom & Plumbing", room: ["Bathroom"], unit: "set", price: 9760, stock: 12, description: "Space-saving rimless wall-hung closet with a hygienic glazed surface.", specs: ["Rimless bowl", "Soft-close seat", "S trap compatible"], tone: "white" },
  { slug: "dr-fixit-roofseal", name: "Dr Fixit Roofseal Select", brand: "Dr Fixit", category: "Waterproofing", categorySlug: "waterproofing", stage: "Plastering & Waterproofing", room: ["Balcony & Terrace"], unit: "20 L bucket", price: 4650, stock: 41, description: "Elastomeric terrace waterproofing coating with heat-reflective performance.", specs: ["Crack bridging", "UV resistance", "5-year system warranty"], tone: "green" },
  { slug: "gyproc-gypsum-board", name: "Gyproc Standard Gypsum Board", brand: "Gyproc", category: "False Ceiling & Drywall", categorySlug: "false-ceiling--drywall", stage: "False Ceiling", room: ["Living Room", "Bedroom", "Study / Home Office"], unit: "12.5 mm × 6 × 4 ft", price: 540, stock: 94, description: "Lightweight gypsum board for clean interior partitions and ceilings.", specs: ["Tapered edge", "Smooth paper surface", "Low dead load"], tone: "ivory" },
  { slug: "fenesta-upvc-window", name: "Fenesta uPVC Sliding Window", brand: "Fenesta", category: "Doors & Windows", categorySlug: "doors--windows", stage: "Doors, Windows, Railings & Glass", room: ["Living Room", "Bedroom"], unit: "custom size", price: 9250, stock: 9, description: "Weather-sealed two-track sliding window with clear glass and secure hardware.", specs: ["Multi-chamber profile", "EPDM sealing", "Made to measure"], tone: "window" },
];

export function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
