import { NextResponse } from "next/server";
import { Resend } from "resend";

const OWNER_EMAIL = "sakshamtandon1205@gmail.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 5000;

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, message, website } = body as Record<string, unknown>;

  // Honeypot: a real visitor never fills this hidden field in.
  if (typeof website === "string" && website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  if (!trimmedName || !trimmedEmail || !trimmedMessage) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
  }
  if (trimmedName.length > MAX_FIELD_LENGTH || trimmedEmail.length > MAX_FIELD_LENGTH || trimmedMessage.length > MAX_FIELD_LENGTH) {
    return NextResponse.json({ error: "One of those fields is too long." }, { status: 400 });
  }

  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (!domain) {
    console.error("RESEND_EMAIL_DOMAIN is not configured.");
    return NextResponse.json({ error: "Contact form isn't configured yet — email me directly instead." }, { status: 500 });
  }

  const { error } = await resend.emails.send({
    from: `PlanMyLoans contact form <contact@${domain}>`,
    to: [OWNER_EMAIL],
    replyTo: trimmedEmail,
    subject: `New message from ${trimmedName}`,
    html: `<p><strong>From:</strong> ${escapeHtml(trimmedName)} (${escapeHtml(trimmedEmail)})</p><p>${escapeHtml(trimmedMessage).replace(/\n/g, "<br>")}</p>`,
    text: `From: ${trimmedName} (${trimmedEmail})\n\n${trimmedMessage}`,
  });

  if (error) {
    console.error("Resend send failed:", error);
    return NextResponse.json({ error: "Couldn't send that — try emailing me directly instead." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
