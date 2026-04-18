// Module: services — capability list aligned to SMAT brief.

import Link from "next/link";

export const metadata = {
  title: "Services",
  description: "Packaging, apparel tech packs, brand identity, 3D visualization, photography — SMAT Designs.",
};

const blocks = [
  {
    title: "Packaging & CPG",
    items: ["Die-lines & prepress-ready files", "Mylar and rigid systems", "Cannabis compliance-aware layouts", "Retail display & POP"],
  },
  {
    title: "Apparel & fashion",
    items: ["Tech packs & Illustrator packages", "Fit documentation", "Seasonal capsules", "Streetwear & rhinestone programs"],
  },
  {
    title: "Brand & campaign",
    items: ["Identity systems", "Kickstarter & crowdfunding visuals", "PR and social assets", "House brands (e.g. Skyn Patch)"],
  },
  {
    title: "3D & photography",
    items: ["Product visualization (Blender)", "Hero renders for pitch and shelf", "Product & campaign photography", "Retouch aligned to brand"],
  },
];

export default function ServicesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-[family-name:var(--font-bebas)] text-5xl text-white md:text-6xl">Services</h1>
      <p className="mt-6 max-w-2xl text-lg text-zinc-400">
        One studio thread from strategy through production files — so creative, manufacturing, and retail stay aligned.
      </p>
      <div className="mt-16 grid gap-12 md:grid-cols-2">
        {blocks.map((b) => (
          <div key={b.title} className="rounded-lg border border-zinc-800 bg-[#0A0A0A] p-8">
            <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-[#FF8C00]">{b.title}</h2>
            <ul className="mt-6 space-y-3 text-zinc-400">
              {b.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#FF8C00]">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-16 text-center">
        <Link href="/contact" className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#FF8C00] hover:underline">
          Start a project →
        </Link>
      </p>
    </main>
  );
}
