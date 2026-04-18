// Module: work index — full case study grid with lane filter labels.

import Image from "next/image";
import Link from "next/link";
import { CASE_STUDIES, type CaseLane } from "@/content/cases";

const laneLabel: Record<CaseLane, string> = {
  scott: "Packaging / 2D / web",
  ariel: "3D / photo",
  studio: "Studio",
};

export const metadata = {
  title: "Work",
  description: "SMAT Designs case studies — packaging, apparel, 3D, and photography.",
};

export default function WorkPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-[family-name:var(--font-bebas)] text-5xl text-white md:text-6xl">Work</h1>
      <p className="mt-4 max-w-2xl text-zinc-400">
        Curated projects — each page includes the brief, deliverables, and hero imagery from studio archives.
      </p>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {CASE_STUDIES.map((c) => (
          <Link
            key={c.slug}
            href={`/work/${c.slug}`}
            className="group overflow-hidden rounded-lg border border-zinc-800 bg-[#0A0A0A] transition hover:border-[#FF8C00]/40"
          >
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={c.heroImage}
                alt={c.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                sizes="(max-width:768px) 100vw, 33vw"
              />
            </div>
            <div className="p-5">
              <span className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-zinc-600">
                {laneLabel[c.lane]}
              </span>
              <h2 className="mt-1 text-xl font-semibold text-white">{c.title}</h2>
              <p className="mt-2 text-sm text-zinc-500">{c.tagline}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
