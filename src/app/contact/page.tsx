// Module: contact — client form posting to /api/contact (Resend).

"use client";

import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      company: String(fd.get("company") || ""),
      details: String(fd.get("details") || ""),
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || "Request failed");
      setStatus("ok");
      setMessage("Thanks — we will get back to you shortly.");
      e.currentTarget.reset();
    } catch {
      setStatus("err");
      setMessage("Could not send. Email sm@smatdesigns.com directly.");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-[family-name:var(--font-bebas)] text-5xl text-white md:text-6xl">Contact</h1>
      <p className="mt-6 text-zinc-400">
        New business, partnerships, or project briefs. We reply from <a href="mailto:sm@smatdesigns.com" className="text-[#FF8C00] hover:underline">sm@smatdesigns.com</a>.
      </p>

      <form onSubmit={onSubmit} className="mt-12 space-y-6">
        <div>
          <label htmlFor="name" className="block font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-zinc-500">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-2 w-full rounded border border-zinc-800 bg-[#0A0A0A] px-4 py-3 text-zinc-200 outline-none focus:border-[#FF8C00]/50"
          />
        </div>
        <div>
          <label htmlFor="email" className="block font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-zinc-500">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded border border-zinc-800 bg-[#0A0A0A] px-4 py-3 text-zinc-200 outline-none focus:border-[#FF8C00]/50"
          />
        </div>
        <div>
          <label htmlFor="company" className="block font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-zinc-500">
            Company (optional)
          </label>
          <input
            id="company"
            name="company"
            className="mt-2 w-full rounded border border-zinc-800 bg-[#0A0A0A] px-4 py-3 text-zinc-200 outline-none focus:border-[#FF8C00]/50"
          />
        </div>
        <div>
          <label htmlFor="details" className="block font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-zinc-500">
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
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded bg-[#FF8C00] py-4 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-widest text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {status === "loading" ? "Sending…" : "Send"}
        </button>
        {message ? (
          <p className={`text-sm ${status === "ok" ? "text-green-400" : "text-red-400"}`}>{message}</p>
        ) : null}
      </form>
    </main>
  );
}
