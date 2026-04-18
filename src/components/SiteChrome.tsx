"use client";
// Module: SiteChrome — nav + footer. Mobile hamburger, orange active dot, scroll-blur effect.

import Link from "next/link";
import { useState, useEffect } from "react";

const nav = [
  { href: "/work",     label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/about",    label: "About" },
  { href: "/contact",  label: "Contact" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,5,0.92)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="group relative font-[family-name:var(--font-bebas)] text-2xl tracking-[0.2em] text-white"
        >
          SMAT
          <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 bg-[#FF8C00] transition-all duration-300 group-hover:w-full" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-zinc-400 transition-colors hover:text-white"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#FF8C00] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          <Link
            href="/contact"
            className="btn-glow rounded px-5 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em]"
          >
            Hire Us
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-col gap-1.5 p-2 md:hidden"
          aria-label="Toggle menu"
        >
          <span className={`h-px w-6 bg-white transition-all ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-px w-6 bg-white transition-all ${open ? "opacity-0" : ""}`} />
          <span className={`h-px w-6 bg-white transition-all ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,5,0.98)] px-6 pb-8 pt-4 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-4 font-[family-name:var(--font-mono)] text-sm uppercase tracking-widest text-zinc-300 hover:text-[#FF8C00]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="btn-glow mt-4 inline-block rounded px-6 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest"
          >
            Hire Us
          </Link>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#0A0A0A] px-6 py-16 text-sm text-zinc-500">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <p className="font-[family-name:var(--font-bebas)] text-3xl tracking-[0.2em] text-white">SMAT Designs</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Full-service creative — packaging architecture, apparel tech packs, brand identity, 3D visualization, and photography.
            </p>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-zinc-600">
              Tempe, AZ · Est. 2014
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="mb-4 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-[#FF8C00]">Work</p>
              {["Cannabis", "Fashion", "CPG", "Entertainment"].map((s) => (
                <p key={s} className="mb-2 hover:text-zinc-300 cursor-pointer transition-colors">{s}</p>
              ))}
            </div>
            <div>
              <p className="mb-4 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-[#FF8C00]">Services</p>
              {["Packaging", "Tech Packs", "Brand ID", "3D + Photography"].map((s) => (
                <p key={s} className="mb-2 hover:text-zinc-300 cursor-pointer transition-colors">{s}</p>
              ))}
            </div>
            <div>
              <p className="mb-4 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-[#FF8C00]">Contact</p>
              <a href="mailto:sm@smatdesigns.com" className="mb-2 block transition-colors hover:text-[#FF8C00]">sm@smatdesigns.com</a>
              <a href="mailto:at@smatdesigns.com" className="mb-2 block transition-colors hover:text-[#FF8C00]">at@smatdesigns.com</a>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-8">
          <p className="text-xs text-zinc-700">© {new Date().getFullYear()} SMAT Designs. All rights reserved.</p>
          <p className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-zinc-700">
            Design for Permanence
          </p>
        </div>
      </div>
    </footer>
  );
}
