"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Campaign = {
  id: string;
  advertiser: string;
  assistantName: string;
  welcomeMessage: string;
  sponsorLabel: string;
  ctaLabel: string;
  ctaUrl: string;
  accent: string;
  surface: string;
  starterPrompts: string;
};

type Sponsor = {
  show: boolean;
  label: string;
  advertiser: string;
  message: string;
  reasons: string[];
  ctaLabel: string;
};

type Message = {
  role: "assistant" | "user";
  text: string;
  sponsor?: Sponsor;
};

const fallbackCampaign: Campaign = {
  id: "aera-x-2026",
  advertiser: "Aera X",
  assistantName: "Ask this page",
  welcomeMessage: "I’ve read this page. Ask me anything about cleaner travel, EV ownership, charging or costs.",
  sponsorLabel: "Sponsored match",
  ctaLabel: "Book a test drive",
  ctaUrl: "https://example.com/aera-x",
  accent: "#d9ff63",
  surface: "#173f32",
  starterPrompts: JSON.stringify([
    "Is an EV practical for my commute?",
    "How much range do I need?",
    "Compare running costs",
  ]),
};

function safePrompts(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.slice(0, 4).map(String) : [];
  } catch {
    return [];
  }
}

export default function Widget() {
  const [campaign, setCampaign] = useState<Campaign>(fallbackCampaign);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(() =>
    typeof window === "undefined"
      ? true
      : new URLSearchParams(window.location.search).get("mode") === "inline" ||
        new URLSearchParams(window.location.search).get("open") !== "false",
  );
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [intent, setIntent] = useState("");
  const [liveMode, setLiveMode] = useState<"live" | "fallback" | "checking">("checking");
  const sessionRef = useRef("");
  const bodyRef = useRef<HTMLDivElement>(null);

  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);
  const campaignId = params.get("campaign") || fallbackCampaign.id;
  const publisher = params.get("publisher") || "demo-publisher";
  const mode = params.get("mode") || "floating";

  useEffect(() => {
    sessionRef.current =
      globalThis.crypto?.randomUUID?.() || `cs_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    fetch(`/api/campaigns?id=${encodeURIComponent(campaignId)}`)
      .then((response) => response.json())
      .then(({ campaign: next }) => {
        if (!next) return;
        setCampaign(next);
        setMessages([{ role: "assistant", text: next.welcomeMessage }]);
        setPrompts(safePrompts(next.starterPrompts));
      })
      .catch(() => {
        setMessages([{ role: "assistant", text: fallbackCampaign.welcomeMessage }]);
        setPrompts(safePrompts(fallbackCampaign.starterPrompts));
      });
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionRef.current,
        campaignId,
        publisher,
        pageUrl: params.get("pageUrl") || "",
        pageTitle: params.get("pageTitle") || "",
        type: "unit_loaded",
        metadata: {},
      }),
    }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
    window.parent?.postMessage(
      { source: "chatstreet", type: "resize", open, height: open ? 650 : 74 },
      "*",
    );
  }, [messages, loading, open, leadOpen]);

  const track = (type: string, extra: Record<string, unknown> = {}) => {
    const payload = {
      sessionId: sessionRef.current || "initialising",
      campaignId,
      publisher,
      pageUrl: params.get("pageUrl") || "",
      pageTitle: params.get("pageTitle") || "",
      type,
      intent,
      metadata: extra,
    };
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
    window.parent?.postMessage({ source: "chatstreet", type: "event", event: type, payload }, "*");
  };

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || loading) return;
    const nextMessages = [...messages, { role: "user" as const, text: clean }];
    setMessages(nextMessages);
    setInput("");
    setPrompts([]);
    setLoading(true);
    track("message_sent", { messageLength: clean.length });
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionRef.current,
          campaignId,
          message: clean,
          history: nextMessages.slice(-8),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chat unavailable");
      setLiveMode(data.mode === "live" ? "live" : "fallback");
      setIntent(data.intent || "");
      const sponsor = data.sponsored?.show ? data.sponsored : undefined;
      setMessages((current) => [...current, { role: "assistant", text: data.answer, sponsor }]);
      setPrompts((data.quickReplies || []).slice(0, 4));
      track("answer_rendered", { mode: data.mode, confidence: data.confidence });
      if (sponsor) track("sponsored_match", { advertiser: sponsor.advertiser, intent: data.intent });
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "I’m having trouble answering right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(input);
  };

  const clickPrompt = (prompt: string) => {
    if (/book|advisor|callback|email|test drive/i.test(prompt)) {
      setLeadOpen(true);
      track("lead_form_opened", { label: prompt });
      return;
    }
    send(prompt);
  };

  const sponsorClick = () => {
    setLeadOpen(true);
    track("cta_click", { label: campaign.ctaLabel, intent });
  };

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionRef.current,
        campaignId,
        name: form.get("name"),
        contact: form.get("contact"),
        city: form.get("city"),
        consent: form.get("consent") === "on",
        intent,
      }),
    });
    if (response.ok) {
      setLeadDone(true);
      track("lead_submitted", { intent });
    }
  };

  const theme = {
    "--cs-accent": campaign.accent,
    "--cs-surface": campaign.surface,
  } as React.CSSProperties;

  if (!open) {
    return (
      <button className="cs-launcher" style={theme} onClick={() => { setOpen(true); track("unit_opened"); }}>
        <span>✦</span><b>{campaign.assistantName}</b><i>AI</i>
      </button>
    );
  }

  return (
    <section className={`cs-widget ${mode === "inline" ? "cs-inline" : ""}`} style={theme}>
      <header className="cs-head">
        <div className="cs-identity"><span>✦</span><div><b>{campaign.assistantName}</b><small>Understands this page</small></div></div>
        <div className="cs-head-actions">
          <i title={liveMode === "live" ? "Live AI" : "Preview mode"}>{liveMode === "live" ? "LIVE AI" : "AI"}</i>
          {mode !== "inline" && <button onClick={() => setOpen(false)} aria-label="Minimize">—</button>}
        </div>
      </header>

      {!leadOpen ? (
        <>
          <div className="cs-body" ref={bodyRef} aria-live="polite">
            <div className="cs-context"><span /> Context from this article is ready</div>
            {messages.map((message, index) => (
              <div key={index} className={`cs-message cs-${message.role}`}>
                <p>{message.text}</p>
                {message.sponsor && (
                  <article className="cs-sponsor">
                    <div><small>{message.sponsor.label || campaign.sponsorLabel}</small><b>{message.sponsor.advertiser}</b></div>
                    <p>{message.sponsor.message}</p>
                    <ul>{message.sponsor.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                    <button onClick={sponsorClick}>{message.sponsor.ctaLabel || campaign.ctaLabel}<span>↗</span></button>
                  </article>
                )}
              </div>
            ))}
            {loading && <div className="cs-typing"><i /><i /><i /></div>}
            {prompts.length > 0 && (
              <div className="cs-prompts">
                {prompts.map((prompt) => <button key={prompt} onClick={() => clickPrompt(prompt)}>{prompt}</button>)}
              </div>
            )}
          </div>
          <form className="cs-compose" onSubmit={submit}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question…" aria-label="Ask a question" />
            <button disabled={!input.trim() || loading} aria-label="Send">↑</button>
          </form>
          <footer>Powered by <b>ChatStreet</b><span>Sponsored suggestions are labelled</span></footer>
        </>
      ) : (
        <div className="cs-lead">
          <button className="cs-back" onClick={() => setLeadOpen(false)}>← Back</button>
          {!leadDone ? (
            <>
              <small>{campaign.sponsorLabel} · {campaign.advertiser}</small>
              <h2>Continue with a human</h2>
              <p>Your declared interest is attached. The full private conversation is not shared.</p>
              <form onSubmit={submitLead}>
                <label>Name<input name="name" required placeholder="Your name" /></label>
                <label>Mobile or email<input name="contact" required placeholder="+91 98… or name@email.com" /></label>
                <label>City<input name="city" placeholder="Hyderabad" /></label>
                <label className="cs-consent"><input name="consent" type="checkbox" required /> I agree to be contacted about {campaign.advertiser}.</label>
                <button>Request a callback</button>
              </form>
            </>
          ) : (
            <div className="cs-success"><span>✓</span><h2>Request captured</h2><p>An advisor can now follow up using the details you provided.</p><button onClick={() => setLeadOpen(false)}>Done</button></div>
          )}
        </div>
      )}
    </section>
  );
}
