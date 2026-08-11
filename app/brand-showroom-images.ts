const curatedShowroomImages: Array<{ aliases: string[]; src: string }> = [
  { aliases: ["anchor", "anchor by panasonic", "panasonic life solutions"], src: "/brands/showroom/brand-anchor-panasonic.jpg" },
  { aliases: ["asian paints", "asianpaints"], src: "/brands/showroom/brand-asian-paints.jpg" },
  { aliases: ["berger paints", "berger"], src: "/brands/showroom/brand-berger-paints.jpg" },
  { aliases: ["centuryply", "century ply", "century plywood"], src: "/brands/showroom/brand-centuryply.jpg" },
  { aliases: ["dr fixit", "drfixit"], src: "/brands/showroom/brand-dr-fixit.jpg" },
  { aliases: ["fenesta"], src: "/brands/showroom/brand-fenesta.jpg" },
  { aliases: ["godrej"], src: "/brands/showroom/brand-godrej.jpg" },
  { aliases: ["gyproc", "saint gobain gyproc"], src: "/brands/showroom/brand-gyproc.jpg" },
  { aliases: ["hindware"], src: "/brands/showroom/brand-hindware.jpg" },
  { aliases: ["jaquar"], src: "/brands/showroom/brand-jaquar.jpg" },
  { aliases: ["kajaria", "kajaria ceramics"], src: "/brands/showroom/brand-kajaria.jpg" },
  { aliases: ["legrand"], src: "/brands/showroom/brand-legrand.jpg" },
  { aliases: ["magicrete"], src: "/brands/showroom/brand-magicrete.jpg" },
  { aliases: ["philips"], src: "/brands/showroom/brand-philips.jpg" },
  { aliases: ["polycab"], src: "/brands/showroom/brand-polycab.jpg" },
  { aliases: ["sika"], src: "/brands/showroom/brand-sika.jpg" },
  { aliases: ["tata steel", "tata tiscon", "tata steel tiscon"], src: "/brands/showroom/brand-tata-tiscon.jpg" },
  { aliases: ["ultratech", "ultratech cement"], src: "/brands/showroom/brand-ultratech-cement.jpg" },
];

function normalizeBrandName(name: string) {
  return name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

export function brandShowroomImageFor(name: string) {
  const normalizedName = normalizeBrandName(name);
  return curatedShowroomImages.find(({ aliases }) => aliases.includes(normalizedName))?.src ?? null;
}
