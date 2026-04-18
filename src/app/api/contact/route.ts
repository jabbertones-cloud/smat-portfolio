// Module: contact API — POST JSON to Resend. Requires RESEND_API_KEY, CONTACT_TO_EMAIL.

import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  const to = process.env.CONTACT_TO_EMAIL || "sm@smatdesigns.com";
  const from = process.env.CONTACT_FROM_EMAIL || "SMAT Portfolio <onboarding@resend.dev>";

  let body: { name?: string; email?: string; company?: string; details?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const company = String(body.company || "").trim();
  const details = String(body.details || "").trim();

  if (!name || !email || !details) {
    return NextResponse.json({ error: "Missing name, email, or details" }, { status: 400 });
  }

  if (!resend) {
    return NextResponse.json(
      { error: "Email not configured. Set RESEND_API_KEY in production." },
      { status: 503 },
    );
  }

  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: email,
    subject: `SMAT contact: ${name}${company ? ` (${company})` : ""}`,
    text: `From: ${name} <${email}>\nCompany: ${company || "—"}\n\n${details}`,
  });

  if (error) {
    return NextResponse.json({ error: error.message || "Send failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
