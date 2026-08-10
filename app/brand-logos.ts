const curatedBrandLogos: Array<{ aliases: string[]; src: string; displayScale: number }> = [
  { aliases: ["anchor", "anchor by panasonic", "panasonic life solutions"], src: "/brands/logos/anchor-by-panasonic.png", displayScale: 2.35 },
  { aliases: ["asian paints", "asianpaints"], src: "/brands/logos/asian-paints.png", displayScale: 2.5 },
  { aliases: ["centuryply", "century ply", "century plywood"], src: "/brands/logos/centuryply.png", displayScale: 2 },
  { aliases: ["dr fixit", "drfixit"], src: "/brands/logos/dr-fixit.png", displayScale: 2 },
  { aliases: ["fenesta"], src: "/brands/logos/fenesta.png", displayScale: 2.3 },
  { aliases: ["godrej"], src: "/brands/logos/godrej.png", displayScale: 1.9 },
  { aliases: ["gyproc", "saint gobain gyproc"], src: "/brands/logos/gyproc.png", displayScale: 2.65 },
  { aliases: ["hindware"], src: "/brands/logos/hindware.png", displayScale: 2.5 },
  { aliases: ["jaquar"], src: "/brands/logos/jaquar.png", displayScale: 2.15 },
  { aliases: ["kajaria", "kajaria ceramics"], src: "/brands/logos/kajaria.png", displayScale: 2.45 },
  { aliases: ["legrand"], src: "/brands/logos/legrand.png", displayScale: 2.45 },
  { aliases: ["magicrete"], src: "/brands/logos/magicrete.png", displayScale: 2.35 },
  { aliases: ["philips"], src: "/brands/logos/philips.png", displayScale: 2.55 },
  { aliases: ["polycab"], src: "/brands/logos/polycab.png", displayScale: 2.65 },
  { aliases: ["sika"], src: "/brands/logos/sika.png", displayScale: 2 },
  { aliases: ["tata steel", "tata tiscon", "tata steel tiscon"], src: "/brands/logos/tata-tiscon.png", displayScale: 1.9 },
  { aliases: ["ultratech", "ultratech cement"], src: "/brands/logos/ultratech-cement.png", displayScale: 1.8 },
];

function normalizeBrandName(name: string) {
  return name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

function curatedBrandLogoEntryFor(name: string) {
  const normalizedName = normalizeBrandName(name);
  return curatedBrandLogos.find(({ aliases }) => aliases.includes(normalizedName)) ?? null;
}

export function curatedBrandLogoFor(name: string) {
  return curatedBrandLogoEntryFor(name)?.src ?? null;
}

export function curatedBrandLogoScaleFor(name: string) {
  return curatedBrandLogoEntryFor(name)?.displayScale ?? 1;
}
