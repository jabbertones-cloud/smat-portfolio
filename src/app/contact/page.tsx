"use client";

import { useState } from "react";

const FORMSPREE = "https://formspree.io/f/xpwzgkjr"; // Formspree endpoint — free tier

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(FORMSPREE, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setStatus("ok");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("err");
      }
    } catch {
      setStatus("err");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-[family-name:var(--font-bebas)] text-5xl text-white md:text-6xl">
        Contact
      </h1>
      <p className="mt-6 text-zinc-400">
        New business, partnerships, or project briefs. We reply from{" "}
        <a href="mailto:sm@smatdesigns.com" className="text-[#FF8C00] hover:underline">
          sm@smatdesigns.com
        </a>
        .
      </p>

      {status === "ok" ? (
        <div className="mt-12 rounded border border-green-800 bg-green-900/20 p-8 text-center">
          <p className="text-lg text-green-400">Message sent — talk soon.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-12 space-y-6">
          {[
            { id: "name", label: "Name", type: "text", required: true },
            { id: "email", label: "Email", type: "email", required: true },
            { id: "company", label: "Company (optional)", type: "text", required: false },
          ].map(({ id, label, type, required }) => (
            <div key={id}>
              <label
                htmlFor={id}
                className="block font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-zinc-500"
              >
                {label}
              </label>
              <input
                id={id}
                name={id}
                type={type}
                required={required}
                className="mt-2 w-full rounded border border-zinc-800 bg-[#0A0A0A] px-4 py-3 text-zinc-200 outline-none focus:border-[#FF8C00]/50"
              />
            </div>
          ))}
          <div>
            <label
              htmlFor="details"
              className="block font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-zinc-500"
            >
              Project details
            </label>
            <textarea
              id="details"
              name="details"
              required
              rows={5}
              className="mt-2 w-full rounded border border-zinc-800 bg-[#0A0A0A] px-4 py-3 text-zinc-200 outline-none focus:border-[#FF8C00]/50"
            />
          </div>
          {status === "err" && (
            <p className="text-sm text-red-400">
              Could not send. Email{" "}
              <a href="mailto:sm@smatdesigns.com" className="underline">
                sm@smatdesigns.com
              </a>{" "}
              directly.
            </p>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded bg-[#FF8C00] py-4 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-widest text-black transition hover:brightness-110 disabled:opacity-50"
          >
            {status === "loading" ? "Sending…" : "Send Message"}
          </button>
        </form>
      )}
    </main>
  );
}
