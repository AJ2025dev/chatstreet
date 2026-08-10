"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
  sponsored?: boolean;
};

type EventItem = {
  name: string;
  detail: string;
  time: string;
};

const starterMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    text: "I’ve read this page. Ask me anything about cleaner city travel, EV ownership, charging, or costs.",
  },
];

const prompts = [
  "Is an EV practical for my daily commute?",
  "How much range do I actually need?",
  "Compare running costs with petrol",
];

const replies = {
  commute: {
    answer:
      "For a 35–50 km daily commute, home charging matters more than headline range. A real-world range above 300 km usually leaves plenty of buffer, even with air-conditioning and occasional detours.",
    sponsored:
      "Based on that usage, Aera X may be relevant: 410 km certified range, an 8-year battery warranty, and a home-charger installation option.",
    next: ["Show estimated savings", "What about charging?", "Book a test drive"],
  },
  range: {
    answer:
      "Most city drivers only need 250–350 km of dependable real-world range. Choose more if you make frequent intercity trips or cannot charge reliably at home.",
    sponsored:
      "Aera X is one matching option, with 410 km certified range and route-aware charging recommendations.",
    next: ["Compare variants", "Calculate my commute", "Book a test drive"],
  },
  cost: {
    answer:
      "Electric cars generally cost less per kilometre to run, but the break-even point depends on purchase price, electricity tariff, annual distance, insurance, and resale value.",
    sponsored:
      "Aera X currently includes a personalised five-year cost comparison and home-charging assessment.",
    next: ["Estimate my savings", "See finance options", "Talk to an advisor"],
  },
  charging: {
    answer:
      "If you have a dedicated parking spot, overnight AC charging covers most daily use. Public fast charging is best treated as a top-up for longer journeys, not the default routine.",
    sponsored:
      "Aera X includes charger-site assessment and installation support in participating cities.",
    next: ["Check my pincode", "Charging time", "Talk to an advisor"],
  },
  savings: {
    answer:
      "At 1,200 km per month, the result can shift significantly with local petrol and electricity prices. I can create a more useful estimate after two quick inputs.",
    sponsored:
      "Aera X offers a personalised ownership-cost report using your commute and local tariff.",
    next: ["Start cost calculator", "Compare variants", "Email me the guide"],
  },
  default: {
    answer:
      "The practical decision comes down to your daily distance, access to overnight charging, occasional long trips, and total five-year cost—not just the advertised range.",
    sponsored:
      "Aera X is one relevant option in this category, with 410 km certified range and an 8-year battery warranty.",
    next: ["Calculate my commute", "Compare running costs", "Ask another question"],
  },
};

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getReply(input: string) {
  const value = input.toLowerCase();
  if (value.includes("charg")) return replies.charging;
  if (value.includes("sav") || value.includes("finance")) return replies.savings;
  if (value.includes("range") || value.includes("variant")) return replies.range;
  if (value.includes("cost") || value.includes("petrol")) return replies.cost;
  if (value.includes("commute") || value.includes("practical")) return replies.commute;
  return replies.default;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [view, setView] = useState<"experience" | "console">("experience");
  const [events, setEvents] = useState<EventItem[]>([
    { name: "unit_viewable", detail: "ChatStreet loaded · 100% viewable", time: now() },
  ]);
  const [quickReplies, setQuickReplies] = useState(prompts);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const idRef = useRef(2);

  const engagement = useMemo(
    () => events.filter((event) => event.name !== "unit_viewable").length,
    [events],
  );

  const track = (name: string, detail: string) => {
    setEvents((current) => [{ name, detail, time: now() }, ...current].slice(0, 8));
  };

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || typing) return;
    const response = getReply(clean);
    setMessages((current) => [
      ...current,
      { id: idRef.current++, role: "user", text: clean },
    ]);
    setInput("");
    setTyping(true);
    setQuickReplies([]);
    track("intent_detected", clean);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: idRef.current++, role: "assistant", text: response.answer },
        {
          id: idRef.current++,
          role: "assistant",
          text: response.sponsored,
          sponsored: true,
        },
      ]);
      setQuickReplies(response.next);
      setTyping(false);
      track("sponsored_match", "Aera X · contextual relevance 94%");
    }, 720);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(input);
  };

  const quickAction = (label: string) => {
    if (/book|advisor|email|pincode/i.test(label)) {
      setLeadOpen(true);
      track("conversion_open", label);
      return;
    }
    send(label);
  };

  const submitLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLeadSent(true);
    track("lead_submitted", "Qualified EV interest · Aera X");
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#" aria-label="ChatStreet home">
          <span className="brand-mark">CS</span>
          <span>ChatStreet<span className="brand-dot">.</span></span>
        </a>
        <nav className="view-switch" aria-label="Product views">
          <button className={view === "experience" ? "active" : ""} onClick={() => setView("experience")}>
            Live experience
          </button>
          <button className={view === "console" ? "active" : ""} onClick={() => setView("console")}>
            Campaign console
          </button>
          <a href="/studio">Open Studio ↗</a>
        </nav>
        <div className="status"><span /> Demo campaign live</div>
      </header>

      {view === "experience" ? (
        <div className="experience-shell">
          <article className="publisher">
            <div className="publisher-nav">
              <b>FIELD NOTES</b>
              <span>Mobility</span><span>Climate</span><span>Cities</span><span>Design</span>
            </div>
            <div className="story-meta">THE BETTER CITY · 8 MIN READ</div>
            <h1>The quiet rethink<br />of the daily commute</h1>
            <p className="dek">
              Cleaner streets will not come from one perfect vehicle. They will come from millions
              of better, more informed choices.
            </p>
            <div className="byline">
              <span className="avatar">MK</span>
              <div><b>Mira Kapoor</b><small>Mobility correspondent · 27 July 2026</small></div>
            </div>
            <div className="story-grid">
              <div className="story-copy">
                <p><span className="dropcap">T</span>he most important change in urban transport may be less visible than a new metro line. It is the growing habit of choosing a vehicle around actual daily use.</p>
                <p>Range, charging, running cost and convenience deserve more attention than a glossy specification sheet.</p>
              </div>
              <div className="story-visual" aria-label="Abstract city mobility illustration">
                <div className="sun" /><div className="road" /><div className="car"><i /><i /></div>
                <span>THE 15-MINUTE CITY</span>
              </div>
            </div>
          </article>

          <aside className={`chatstreet ${minimized ? "minimized" : ""}`} aria-label="ChatStreet contextual assistant">
            <div className="chat-head">
              <div>
                <span className="spark">✦</span>
                <div><b>Ask this page</b><small>Powered by ChatStreet</small></div>
              </div>
              <button onClick={() => setMinimized(!minimized)} aria-label={minimized ? "Expand assistant" : "Minimize assistant"}>
                {minimized ? "↑" : "—"}
              </button>
            </div>

            {!minimized && (
              <>
                <div className="chat-body" aria-live="polite">
                  <div className="context-pill">Understands this article</div>
                  {messages.map((message) => (
                    <div key={message.id} className={`message ${message.role} ${message.sponsored ? "sponsored" : ""}`}>
                      {message.sponsored && <div className="sponsor-label"><span>Sponsored match</span><b>AERA X</b></div>}
                      <p>{message.text}</p>
                      {message.sponsored && (
                        <div className="sponsor-proof">
                          <span>410 km range</span><span>8-year warranty</span><span>Home charger</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {typing && <div className="typing" aria-label="Assistant is typing"><i /><i /><i /></div>}
                  {quickReplies.length > 0 && (
                    <div className="quick-replies">
                      {quickReplies.map((prompt) => (
                        <button key={prompt} onClick={() => quickAction(prompt)}>{prompt}</button>
                      ))}
                    </div>
                  )}
                </div>
                <form className="composer" onSubmit={submit}>
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask a follow-up…"
                    aria-label="Ask ChatStreet"
                  />
                  <button type="submit" aria-label="Send question">↑</button>
                </form>
                <div className="disclosure">AI guidance · Sponsored suggestions are always labelled</div>
              </>
            )}
          </aside>

          {leadOpen && (
            <div className="modal-backdrop" role="presentation" onMouseDown={() => setLeadOpen(false)}>
              <div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-title" onMouseDown={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setLeadOpen(false)} aria-label="Close">×</button>
                {!leadSent ? (
                  <>
                    <span className="eyebrow">AERA X · SPONSORED</span>
                    <h2 id="lead-title">Continue with a human</h2>
                    <p>Your conversation has already captured the context. Just tell us where to send the personalised response.</p>
                    <form onSubmit={submitLead}>
                      <label>Name<input required placeholder="Your name" /></label>
                      <label>Mobile or email<input required placeholder="+91 98… or name@email.com" /></label>
                      <label>City<input required placeholder="Hyderabad" /></label>
                      <button>Request a callback</button>
                    </form>
                    <small>Consent and advertiser privacy terms apply.</small>
                  </>
                ) : (
                  <div className="success">
                    <span>✓</span><h2>Request captured</h2>
                    <p>The advertiser receives the lead together with declared intent—not the full private conversation.</p>
                    <button onClick={() => setLeadOpen(false)}>Back to the article</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <section className="console">
          <div className="console-heading">
            <div><span className="eyebrow">CAMPAIGN CONSOLE</span><h1>Aera X · Contextual consideration</h1></div>
            <button onClick={() => setView("experience")}>Open live unit ↗</button>
          </div>
          <div className="metric-grid">
            <article><small>Meaningful conversations</small><strong>{Math.max(2847, 2847 + engagement)}</strong><span>↑ 18.4% vs benchmark</span></article>
            <article><small>Qualified intent rate</small><strong>31.8%</strong><span>903 high-intent sessions</span></article>
            <article><small>Sponsored match CTR</small><strong>12.6%</strong><span>Context-aware exposure</span></article>
            <article><small>Leads captured</small><strong>{leadSent ? 95 : 94}</strong><span>3.3% conversation-to-lead</span></article>
          </div>
          <div className="console-grid">
            <article className="intent-card">
              <div className="panel-head"><div><small>LIVE SIGNAL</small><h2>Declared user intent</h2></div><span>Last 7 days</span></div>
              <div className="intent-row"><b>Running cost & savings</b><span><i style={{width:"78%"}} /></span><em>38%</em></div>
              <div className="intent-row"><b>Range confidence</b><span><i style={{width:"62%"}} /></span><em>29%</em></div>
              <div className="intent-row"><b>Home charging</b><span><i style={{width:"44%"}} /></span><em>19%</em></div>
              <div className="intent-row"><b>Finance & variants</b><span><i style={{width:"31%"}} /></span><em>14%</em></div>
              <div className="insight"><span>✦</span><p><b>ChatStreet insight</b> Users asking about five-year cost are 2.7× more likely to request a test drive. The sponsored response now prioritises the cost calculator for this intent.</p></div>
            </article>
            <article className="event-card">
              <div className="panel-head"><div><small>YOUR SESSION</small><h2>Event stream</h2></div><span className="live">Live</span></div>
              <div className="event-list">
                {events.map((event, index) => (
                  <div key={`${event.name}-${index}`}><i /><p><b>{event.name}</b><span>{event.detail}</span></p><time>{event.time}</time></div>
                ))}
              </div>
            </article>
          </div>
          <div className="integration-strip">
            <div><small>DELIVERY</small><b>One conversational creative, existing media pipes.</b></div>
            <span>Google Ad Manager</span><span>DV360</span><span>The Trade Desk</span><span>RTB / VAST bridge</span>
          </div>
        </section>
      )}
    </main>
  );
}
