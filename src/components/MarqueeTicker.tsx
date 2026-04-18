"use client";
// Module: MarqueeTicker — infinite CSS marquee of brand names / service labels.

const items = [
  "Cannabis Packaging",
  "Apparel Tech Packs",
  "Brand Identity",
  "3D Visualization",
  "Product Photography",
  "Retail Displays",
  "CPG Design",
  "Streetwear Graphics",
  "Die-Lines & Prepress",
  "Campaign Creative",
  "Kickstarter Builds",
  "Lookbooks",
];

const doubled = [...items, ...items];

export function MarqueeTicker() {
  return (
    <div className="marquee-wrapper border-y border-[rgba(255,255,255,0.06)] py-4">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="mx-8 flex items-center gap-3 whitespace-nowrap font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-zinc-500"
          >
            <span className="inline-block h-1 w-1 rounded-full bg-[#FF8C00]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
