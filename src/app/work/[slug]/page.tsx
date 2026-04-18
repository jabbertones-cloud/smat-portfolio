// Module: work detail — single case study from cases.ts.

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CASE_STUDIES, getCaseBySlug } from "@/content/cases";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const c = getCaseBySlug(slug);
  if (!c) return { title: "Not found" };
  return {
    title: c.title,
    description: c.brief.slice(0, 160),
    openGraph: { images: [{ url: c.heroImage }] },
  };
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const c = getCaseBySlug(slug);
  if (!c) notFound();

  return (
    <article className="mx-auto max-w-4xl px-6 py-16">
      <Link href="/work" className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#FF8C00] hover:underline">
        ← Work
      </Link>
      <p className="mt-6 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-zinc-500">{c.industry}</p>
      <h1 className="mt-2 font-[family-name:var(--font-bebas)] text-5xl text-white md:text-6xl">{c.title}</h1>
      <p className="mt-4 text-xl text-[#FF8C00]">{c.tagline}</p>

      <div className="relative mt-10 aspect-[16/10] w-full overflow-hidden rounded-lg border border-zinc-800">
        <Image src={c.heroImage} alt={c.title} fill className="object-cover" priority sizes="100vw" />
      </div>

      <div className="mt-12 max-w-none space-y-6 text-zinc-400">
        <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white">Brief</h2>
        <p className="leading-relaxed">{c.brief}</p>
        {c.metrics ? (
          <p className="leading-relaxed">
            <strong className="text-zinc-200">Highlight:</strong> {c.metrics}
          </p>
        ) : null}
        <h2 className="pt-4 font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white">Deliverables</h2>
        <ul className="list-disc space-y-2 pl-6 leading-relaxed">
          {c.deliverables.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
