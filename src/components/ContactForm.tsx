"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-xs border border-line-2 bg-surface-2 px-[13px] py-[11px] text-[14px] text-ink placeholder:text-ink-4 focus:border-indigo focus:outline-none";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong — try again or email me directly.");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong — try again or email me directly.");
    }
  };

  if (status === "success") {
    return (
      <div className="glass-panel p-6">
        <div className="mb-2 font-heading text-[15px] font-bold text-ink">Message sent</div>
        <p className="text-body-sm text-ink-2">Thanks for reaching out — I usually reply within 2-3 days.</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-body-sm font-semibold text-accent-text hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6">
      <div className="mb-4 font-heading text-[15px] font-bold text-ink">Send a message</div>
      <div className="flex flex-col gap-3.5">
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] size-px opacity-0"
        />

        <div>
          <div className="mb-1.5 text-[12.5px] font-semibold text-ink-3">Name</div>
          <input
            type="text"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <div className="mb-1.5 text-[12.5px] font-semibold text-ink-3">Email</div>
          <input
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <div className="mb-1.5 text-[12.5px] font-semibold text-ink-3">Message</div>
          <textarea
            required
            placeholder="What's on your mind?"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`${inputClass} resize-y`}
          />
        </div>

        {status === "error" && <p className="text-body-sm text-coral">{errorMessage}</p>}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="cta-tap mt-1 self-start rounded-[10px] bg-[linear-gradient(135deg,var(--indigo),var(--jade))] px-[22px] py-3 font-heading text-[14px] font-bold text-white disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
