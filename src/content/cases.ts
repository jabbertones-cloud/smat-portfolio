// Module: cases — SMAT case study metadata for /work and home. Key exports: CASE_STUDIES, getCaseBySlug, type CaseStudy.

export type CaseLane = "scott" | "ariel" | "studio";

export type CaseStudy = {
  slug: string;
  title: string;
  tagline: string;
  industry: string;
  lane: CaseLane;
  heroImage: string;
  brief: string;
  deliverables: string[];
  metrics?: string;
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "alcs",
    title: "ALCS (Alocs)",
    tagline: "Fashion tech packs & manufacturing depth",
    industry: "Fashion / Apparel",
    lane: "scott",
    heroImage: "/images/plushtrap-bunski-allknit.webp",
    brief:
      "Multi-season apparel programs: cargo shorts, mohair sets, fit cycles, and vendor-ready Illustrator packages. SMAT stays in the loop from first sketch through factory comments.",
    deliverables: ["Tech packs", "Fit documentation", "Seasonal capsule art"],
    metrics: "Featured Tier 1 — deep manufacturing collaboration",
  },
  {
    slug: "sweetoz",
    title: "Sweetoz",
    tagline: "Long-running CPG / cannabis brand evolution",
    industry: "Cannabis / CPG",
    lane: "studio",
    heroImage: "/images/sweetoz-display-case.webp",
    brief:
      "Years of packaging, retail display, 3D props, and campaign assets — a full arc from disposables to retail floor.",
    deliverables: ["Packaging systems", "POP / display", "Campaign creative"],
    metrics: "Long-term client relationship",
  },
  {
    slug: "wmac-masters",
    title: "WMAC Masters",
    tagline: "Entertainment IP — crowdfunding to shelf",
    industry: "Entertainment / Toys",
    lane: "studio",
    heroImage: "/images/wmac-kickstarter.webp",
    brief:
      "Character systems, Kickstarter storytelling, PR assets, and apparel — one thread from concept art to backer-ready visuals.",
    deliverables: ["Brand art", "Kickstarter", "Apparel & collectibles"],
    metrics: "Full campaign stack",
  },
  {
    slug: "heaven-sin",
    title: "Heaven Sin",
    tagline: "Streetwear range & sub-brands",
    industry: "Fashion / Streetwear",
    lane: "scott",
    heroImage: "/images/heavensin-streetwear.webp",
    brief:
      "Rhinestone sets, denim programs, and lookbook-ready layouts — multiple lanes under one house brand.",
    deliverables: ["Apparel graphics", "Lookbooks", "Sub-brand art"],
  },
  {
    slug: "natura-deethai",
    title: "Natura / DeeThai",
    tagline: "Cannabis packaging at production scale",
    industry: "Cannabis",
    lane: "scott",
    heroImage: "/images/mmjcbd-product-shoot.jpg",
    brief:
      "Mylar pouches, disposable pen systems, and RGB print pipelines — files built for prepress, not just decks.",
    deliverables: ["Die-lines", "Pouch systems", "Shirt programs"],
    metrics: "Production-ready packaging",
  },
  {
    slug: "skyn-patch",
    title: "Skyn Patch",
    tagline: "SMAT-owned CPG wellness",
    industry: "Skincare / CPG",
    lane: "studio",
    heroImage: "/images/skynpatch-grace-perfect.webp",
    brief:
      "House brand proof: packaging architecture, ecommerce storytelling, and SKU expansion under one roof.",
    deliverables: ["Packaging", "Web & campaign", "Photography"],
  },
  {
    slug: "at-photography",
    title: "Ariel Tourner Photography",
    tagline: "Product & campaign photography",
    industry: "Photography",
    lane: "ariel",
    heroImage: "/images/ariel-tourner.webp",
    brief:
      "Studio-led shoots aligned with SMAT retail and product launches — retouch and color that match brand systems.",
    deliverables: ["Product photography", "Campaign sets", "Retouch"],
  },
  {
    slug: "3d-game-art-academy",
    title: "3D Game Art Academy",
    tagline: "Client education — 3D pipeline",
    industry: "Education",
    lane: "ariel",
    heroImage: "/images/3dgame-logo.webp",
    brief:
      "Structured 3D curriculum and asset standards that mirror studio delivery — Blender-first workflows for students and pros.",
    deliverables: ["Course creative", "Pipeline consulting", "Asset kits"],
  },
  {
    slug: "product-3d-visualization",
    title: "Product 3D visualization",
    tagline: "Renders for shelf and pitch",
    industry: "3D / Product",
    lane: "ariel",
    heroImage: "/images/slimglp-bottle-premium.webp",
    brief:
      "High-end bottle and product renders — materials, lighting, and handoff that pair with SMAT print packaging.",
    deliverables: ["Blender scenes", "Hero renders", "Revision cycles"],
  },
];

export function getCaseBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug);
}

export function casesForLane(lane: CaseLane): CaseStudy[] {
  return CASE_STUDIES.filter((c) => c.lane === lane || c.lane === "studio");
}
