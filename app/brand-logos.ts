const curatedBrandLogos: Array<{ aliases: string[]; src: string }> = [
  { aliases: ["anchor", "anchor by panasonic", "panasonic life solutions"], src: "/brands/logos/anchor-by-panasonic.png" },
  { aliases: ["asian paints", "asianpaints"], src: "/brands/logos/asian-paints.png" },
  { aliases: ["centuryply", "century ply", "century plywood"], src: "/brands/logos/centuryply.png" },
  { aliases: ["dr fixit", "drfixit"], src: "/brands/logos/dr-fixit.png" },
  { aliases: ["fenesta"], src: "/brands/logos/fenesta.png" },
  { aliases: ["godrej"], src: "/brands/logos/godrej.png" },
  { aliases: ["gyproc", "saint gobain gyproc"], src: "/brands/logos/gyproc.png" },
  { aliases: ["hindware"], src: "/brands/logos/hindware.png" },
  { aliases: ["jaquar"], src: "/brands/logos/jaquar.png" },
  { aliases: ["kajaria", "kajaria ceramics"], src: "/brands/logos/kajaria.png" },
  { aliases: ["legrand"], src: "/brands/logos/legrand.png" },
  { aliases: ["magicrete"], src: "/brands/logos/magicrete.png" },
  { aliases: ["philips"], src: "/brands/logos/philips.png" },
  { aliases: ["polycab"], src: "/brands/logos/polycab.png" },
  { aliases: ["sika"], src: "/brands/logos/sika.png" },
  { aliases: ["tata steel", "tata tiscon", "tata steel tiscon"], src: "/brands/logos/tata-tiscon.png" },
  { aliases: ["ultratech", "ultratech cement"], src: "/brands/logos/ultratech-cement.png" },
];

function normalizeBrandName(name: string) {
  return name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

export function curatedBrandLogoFor(name: string) {
  const normalizedName = normalizeBrandName(name);
  return curatedBrandLogos.find(({ aliases }) => aliases.includes(normalizedName))?.src ?? null;
}
