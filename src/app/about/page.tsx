// Module: about — Scott + Ariel bios and shared studio positioning.

import Link from "next/link";

export const metadata = {
  title: "About",
  description: "Scott Manthey and Ariel Tourner — SMAT Designs, Tempe AZ. Packaging, apparel, 3D, photography.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-[family-name:var(--font-bebas)] text-5xl text-white md:text-6xl">About</h1>
      <p className="mt-6 text-lg leading-relaxed text-zinc-400">
        SMAT Designs is a full-service creative studio in Tempe, Arizona — packaging architecture, apparel tech packs, brand
        systems, 3D visualization, and photography. We work with cannabis, fashion, CPG, and entertainment brands from concept to
        shelf.
      </p>

      <section className="mt-16 border-t border-zinc-800 pt-16">
        <h2 className="font-[family-name:var(--font-bebas)] text-3xl text-white">Scott Manthey</h2>
        <p className="mt-4 leading-relaxed text-zinc-400">
          Co-founder — packaging compliance, apparel 2D, traditional marketing, and web. Narrative: <strong className="text-zinc-200">concept → shelf</strong>{" "}
          with regulatory-aware packaging for long-running programs (Sweetoz, ALCS, Plushtrap, and more).
        </p>
        <p className="mt-4">
          <a
            href="https://www.linkedin.com/in/scottmanthey"
            className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#FF8C00] hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <span className="mx-3 text-zinc-600">·</span>
          <a href="mailto:sm@smatdesigns.com" className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#FF8C00] hover:underline">
            sm@smatdesigns.com
          </a>
        </p>
      </section>

      <section className="mt-16 border-t border-zinc-800 pt-16">
        <h2 className="font-[family-name:var(--font-bebas)] text-3xl text-white">Ariel Tourner</h2>
        <p className="mt-4 leading-relaxed text-zinc-400">
          Co-founder — 3D visualization (Blender), CAD-adjacent delivery, and AT Photography. Product renders, curriculum for 3D
          Game Art Academy, and campaign photography aligned with SMAT launches.
        </p>
        <p className="mt-4">
          <a
            href="https://www.linkedin.com/in/arieltourner"
            className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#FF8C00] hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <span className="mx-3 text-zinc-600">·</span>
          <a href="mailto:at@smatdesigns.com" className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#FF8C00] hover:underline">
            at@smatdesigns.com
          </a>
        </p>
      </section>

      <p className="mt-16 text-center">
        <Link href="/work" className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#FF8C00] hover:underline">
          View work →
        </Link>
      </p>
    </main>
  );
}
