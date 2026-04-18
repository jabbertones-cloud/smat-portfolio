// Module: home — SMAT landing. Hero, marquee, bento case studies, services, CTA.

import Image from "next/image";
import Link from "next/link";
import { CASE_STUDIES } from "@/content/cases";
import { MarqueeTicker } from "@/components/MarqueeTicker";

const featured = CASE_STUDIES.slice(0, 9);

const bentoLayouts = [
  "col-span-12 md:col-span-8 row-span-2",
  "col-span-12 md:col-span-4",
  "col-span-12 md:col-span-4",
  "col-span-12 md:col-span-4",
  "col-span-12 md:col-span-4",
  "col-span-12 md:col-span-8",
  "col-span-12 md:col-span-6",
  "col-span-12 md:col-span-3",
  "col-span-12 md:col-span-3",
];

const services = [
  { label: "Packaging Architecture",  sub: "Die-lines · production files · print-ready" },
  { label: "Apparel Tech Packs",      sub: "Construction · BOM · vendor-ready Illustrator" },
  { label: "Brand Identity Systems",  sub: "Logotype · guidelines · rollout strategy" },
  { label: "3D Visualization",        sub: "Product renders · retail environments · mockups" },
  { label: "Campaign Photography",    sub: "Studio · on-location · retouch & color" },
  { label: "Retail & POP Display",    sub: "Floor fixtures · counter cards · signage" },
];

export default function HomePage() {
  return (
    <main className="pt-16">

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="noise mesh-bg relative overflow-hidden px-6 pb-24 pt-24 md:pt-36">
        {/* Decorative blurred blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#FF8C00] opacity-[0.04] blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 right-0 h-[400px] w-[400px] rounded-full bg-orange-600 opacity-[0.03] blur-[100px]"
        />

        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Eyebrow */}
          <p className="fade-up fade-up-1 mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(255,140,0,0.2)] bg-[rgba(255,140,0,0.06)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.35em] text-[#FF8C00]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF8C00]" />
            SMAT Designs · Tempe, AZ · Est. 2014
          </p>

          {/* Headline */}
          <h1
            className="fade-up fade-up-2 font-[family-name:var(--font-bebas)] leading-[0.92] tracking-tight text-white"
            style={{ fontSize: "clamp(4.5rem, 13vw, 10.5rem)" }}
          >
            From concept
            <br />
            <span className="gradient-text">to shelf.</span>
          </h1>

          <p className="fade-up fade-up-3 mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400">
            Full-service creative for{" "}
            <strong className="text-zinc-200">cannabis, fashion, CPG, and entertainment</strong>
            {" "}— packaging, apparel tech packs, brand systems, 3D visualization, and photography.
            Co-founded by{" "}
            <strong className="text-zinc-200">Scott Manthey</strong> and{" "}
            <strong className="text-zinc-200">Ariel Tourner</strong>.
          </p>

          {/* CTAs */}
          <div className="fade-up fade-up-4 mt-10 flex flex-wrap gap-4">
            <Link
              href="/work"
              className="btn-glow rounded px-8 py-3.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest"
            >
              View Work
            </Link>
            <Link
              href="/contact"
              className="rounded border border-[rgba(255,140,0,0.3)] px-8 py-3.5 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-widest text-[#FF8C00] transition-all hover:bg-[rgba(255,140,0,0.08)] hover:border-[rgba(255,140,0,0.5)]"
            >
              Start a Project
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-16 flex flex-wrap items-center gap-10 border-y border-[rgba(255,255,255,0.06)] py-8">
            {[
              { n: "70+",   l: "Brands" },
              { n: "10+",   l: "Years" },
              { n: "1,200+",l: "Designs" },
              { n: "3",     l: "Industries" },
            ].map(({ n, l }) => (
              <div key={l} className="flex flex-col">
                <span className="stat-num font-[family-name:var(--font-bebas)] text-4xl tracking-wider">{n}</span>
                <span className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.35em] text-zinc-600">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────── */}
      <MarqueeTicker />

      {/* ── BENTO CASE STUDIES ───────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-4 flex items-center gap-4">
            <span className="line-accent" />
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.35em] text-[#FF8C00]">Featured Work</p>
          </div>
          <div className="mb-12 flex items-end justify-between gap-4">
            <h2
              className="font-[family-name:var(--font-bebas)] leading-none tracking-wide text-white"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
            >
              Case Studies
            </h2>
            <Link
              href="/work"
              className="hidden shrink-0 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-[#FF8C00] sm:inline-flex items-center gap-2"
            >
              All projects →
            </Link>
          </div>

          {/* Bento grid */}
          <div className="bento-grid">
            {featured.map((c, i) => (
              <Link
                key={c.slug}
                href={`/work/${c.slug}`}
                className={`bento-card group ${bentoLayouts[i] ?? "col-span-12 md:col-span-4"}`}
              >
                {/* Image */}
                <div
                  className={`relative w-full overflow-hidden ${
                    i === 0 ? "aspect-[16/9]" : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={c.heroImage}
                    alt={c.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width:768px) 100vw, 50vw"
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {/* Industry chip */}
                  <div className="absolute left-4 top-4 rounded-full border border-[rgba(255,255,255,0.12)] bg-black/50 px-3 py-1 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-zinc-300 backdrop-blur-sm">
                    {c.industry}
                  </div>
                </div>

                {/* Text */}
                <div className="relative z-10 p-5">
                  <h3 className="text-lg font-semibold text-white">{c.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{c.tagline}</p>
                  {c.metrics && (
                    <p className="mt-3 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-[#FF8C00]">
                      {c.metrics}
                    </p>
                  )}
                </div>

                {/* Arrow reveal */}
                <div className="absolute bottom-4 right-4 z-10 flex h-8 w-8 translate-x-2 items-center justify-center rounded-full border border-[rgba(255,140,0,0.3)] bg-[rgba(255,140,0,0.08)] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                  <span className="text-xs text-[#FF8C00]">→</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center sm:hidden">
            <Link href="/work" className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#FF8C00] hover:underline">
              All projects →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────── */}
      <section className="border-t border-[rgba(255,255,255,0.06)] bg-[#0A0A0A] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-4 flex items-center gap-4">
            <span className="line-accent" />
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.35em] text-[#FF8C00]">What We Do</p>
          </div>
          <h2
            className="mb-12 font-[family-name:var(--font-bebas)] leading-none text-white"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
          >
            Services
          </h2>

          <div className="divide-y divide-[rgba(255,255,255,0.05)]">
            {services.map((svc, i) => (
              <div
                key={svc.label}
                className="service-item flex items-center justify-between px-0 py-6 transition-all"
              >
                <div className="flex items-center gap-6">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#FF8C00] opacity-50">
                    0{i + 1}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-white">{svc.label}</p>
                    <p className="mt-0.5 text-sm text-zinc-600">{svc.sub}</p>
                  </div>
                </div>
                <span className="text-zinc-700 transition-colors group-hover:text-[#FF8C00]">→</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────── */}
      <section className="noise relative overflow-hidden px-6 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(255,140,0,0.07)] via-transparent to-transparent"
        />
        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.35em] text-[#FF8C00]">
            Ready to start?
          </p>
          <h2
            className="mx-auto mb-8 max-w-3xl font-[family-name:var(--font-bebas)] leading-[0.95] text-white"
            style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}
          >
            Let&rsquo;s build something that lasts.
          </h2>
          <Link
            href="/contact"
            className="btn-glow inline-block rounded px-10 py-4 font-[family-name:var(--font-mono)] text-sm font-bold uppercase tracking-widest"
          >
            Start a Project
          </Link>
        </div>
      </section>

    </main>
  );
}
