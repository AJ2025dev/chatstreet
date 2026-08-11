"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Campaign = {
  id: string; name: string; status: string; advertiser: string; assistantName: string;
  welcomeMessage: string; context: string; sponsorBrief: string; sponsorLabel: string;
  ctaLabel: string; ctaUrl: string; accent: string; surface: string;
  starterPrompts: string; intentRules: string;
};

type Analytics = {
  summary: { widgetLoads: number; engagedSessions: number; conversations: number; sponsoredMatches: number; ctaClicks: number; leads: number };
  recent: Array<{ id: number; type: string; intent?: string; occurred_at: string; metadata?: Record<string, unknown> }>;
  sessions: Array<{ id: string; publisher: string; demand_platform?: string; page_title?: string; created_at: string }>;
  messages: Array<{ id: number; role: string; intent?: string; sponsored: boolean; model?: string; latency_ms?: number; created_at: string }>;
  reconciliation: Array<{ date: string; platform: string; publisher: string; lineItemId: string; creativeId: string; placementId: string; insertionOrderId: string; siteId: string; widgetLoads: number; matchedImpressions: number }>;
};

const blankCampaign: Campaign = {
  id: "", name: "", status: "draft", advertiser: "", assistantName: "Ask this page",
  welcomeMessage: "I’ve read this page. Ask me anything about it.", context: "", sponsorBrief: "",
  sponsorLabel: "Sponsored match", ctaLabel: "Learn more", ctaUrl: "https://", accent: "#d9ff63",
  surface: "#173f32", starterPrompts: "[]", intentRules: "[]",
};

const nav = [
  ["campaign", "Campaign", "✦"], ["delivery", "Delivery tags", "↗"], ["analytics", "Live analytics", "◉"],
] as const;

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");
  return <main className="studio-login"><form onSubmit={(event) => { event.preventDefault(); onLogin(token.trim()); }}>
    <span>CS</span><small>CHATSTREET STUDIO</small><h1>Operate every conversation.</h1>
    <p>Enter the Studio admin token configured in Vercel to manage campaigns and view live delivery.</p>
    <label>Admin token<input type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="current-password" required /></label>
    <button>Open Studio</button>
  </form></main>;
}

export default function Studio() {
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<(typeof nav)[number][0]>("analytics");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaign, setCampaign] = useState<Campaign>(blankCampaign);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setToken(sessionStorage.getItem("chatstreet_admin") || ""), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    if (!token) return;
    const campaignsResponse = await fetch("/api/campaigns?list=1", { headers });
    if (campaignsResponse.status === 401) { setError("That admin token was not accepted."); return; }
    const campaignsData = await campaignsResponse.json();
    const nextCampaigns = campaignsData.campaigns || [];
    setCampaigns(nextCampaigns);
    setCampaign((current) => current.id ? current : nextCampaigns[0] || blankCampaign);
  }, [headers, token]);

  const loadAnalytics = useCallback(async (id: string) => {
    if (!token || !id) return;
    const response = await fetch(`/api/analytics?campaignId=${encodeURIComponent(id)}`, { headers, cache: "no-store" });
    if (response.ok) setAnalytics(await response.json());
  }, [headers, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => load().catch(() => setError("Studio could not reach the campaign service.")), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!campaign.id) return;
    const initial = window.setTimeout(() => loadAnalytics(campaign.id), 0);
    const interval = window.setInterval(() => loadAnalytics(campaign.id), 10000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [campaign.id, loadAnalytics]);

  const login = (next: string) => { sessionStorage.setItem("chatstreet_admin", next); setError(""); setToken(next); };
  const field = (key: keyof Campaign, value: string) => setCampaign((current) => ({ ...current, [key]: value }));
  const save = async (event: FormEvent) => {
    event.preventDefault(); setNotice("Saving…");
    const response = await fetch("/api/campaigns", { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(campaign) });
    const data = await response.json();
    if (!response.ok) { setNotice(data.error || "Could not save campaign"); return; }
    setCampaign(data.campaign); setNotice("Campaign saved live"); await load();
  };

  if (!token) return <Login onLogin={login} />;

  const embedTag = `<script src="https://chatstreet.theaudiencestreet.com/embed.js" data-campaign="${campaign.id}" data-publisher="YOUR_PUBLISHER" data-mode="inline" data-demand-platform="gam" data-placement-id="%%PATTERN:placement%%" data-line-item-id="%eaid!" data-creative-id="%ecid!" data-ad-unit-id="%%ADUNIT%%" data-impression-id="%%CACHEBUSTER%%"></script>`;
  const dv360Tag = `<iframe src="https://chatstreet.theaudiencestreet.com/widget?campaign=${campaign.id}&publisher=\${PUBLISHER_ID}&mode=inline&demandPlatform=dv360&lineItemId=\${CAMPAIGN_ID}&creativeId=\${CREATIVE_ID}&impressionId=\${IMPRESSION_ID}&insertionOrderId=\${INSERTION_ORDER_ID}&publisherId=\${PUBLISHER_ID}&siteId=\${UNIVERSAL_SITE_ID}&auctionId=\${AUCTION_ID}" width="300" height="430" frameborder="0" scrolling="no"></iframe>`;
  const metrics = analytics?.summary || { widgetLoads: 0, engagedSessions: 0, conversations: 0, sponsoredMatches: 0, ctaClicks: 0, leads: 0 };

  return <main className="studio-shell">
    <aside className="studio-nav"><Link className="studio-brand" href="/"><span>CS</span><b>ChatStreet.</b></Link>
      <div className="studio-campaign-pill"><i/><div><small>ACTIVE CAMPAIGN</small><b>{campaign.name || "New campaign"}</b></div></div>
      <nav>{nav.map(([id, label, icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span>{icon}</span>{label}</button>)}</nav>
      <div className="studio-nav-foot"><small>LIVE DATA</small><b>Supabase connected</b><span>Refreshes every 10 seconds</span></div>
    </aside>
    <section className="studio-main">
      <header className="studio-top"><div><span>Campaigns</span><i>/</i><b>{campaign.name || "New"}</b></div><div className="studio-top-actions">
        <select aria-label="Campaign" value={campaign.id} onChange={(e) => setCampaign(campaigns.find((item) => item.id === e.target.value) || campaign)}>{campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <a href={`/widget?campaign=${campaign.id}&publisher=studio-preview&mode=inline`} target="_blank">Open preview</a>
        <button onClick={() => { setCampaign(blankCampaign); setTab("campaign"); }}>New campaign</button>
      </div></header>
      {error && <div className="studio-alert">{error}<button onClick={() => { sessionStorage.removeItem("chatstreet_admin"); setToken(""); }}>Sign in again</button></div>}

      {tab === "analytics" && <section className="analytics-page"><div className="studio-title"><span>LIVE MEASUREMENT</span><h1>What audiences are asking, now.</h1><p>Widget loads are successful ChatStreet renders—not platform impressions. Engaged sessions begin with the first user interaction.</p></div>
        <div className="analytics-cards">{Object.entries(metrics).map(([key, value]) => <article key={key}><small>{key.replace(/([A-Z])/g," $1").toUpperCase()}</small><strong>{value}</strong><span>Campaign lifetime</span></article>)}</div>
        <div className="analytics-live-grid"><article><div className="panel-head"><div><small>RECENT DELIVERY</small><h2>Widget loads</h2></div><span className="live">Live</span></div><div className="event-list">{analytics?.sessions.slice(0,10).map((item) => <div key={item.id}><i/><p><b>{item.publisher || "unknown"}</b><span>{item.page_title || item.demand_platform || "Context unavailable"}</span></p><time>{new Date(item.created_at).toLocaleTimeString()}</time></div>)}</div></article>
        <article><div className="panel-head"><div><small>ENGAGEMENT STREAM</small><h2>Events</h2></div><span>{analytics?.recent.length || 0} recent</span></div><div className="event-list">{analytics?.recent.slice(0,10).map((item) => <div key={item.id}><i/><p><b>{item.type.replaceAll("_"," ")}</b><span>{item.intent || "No declared intent"}</span></p><time>{new Date(item.occurred_at).toLocaleTimeString()}</time></div>)}</div></article></div>
        <div className="reconciliation-panel"><div className="panel-head"><div><small>DELIVERY RECONCILIATION</small><h2>Platform dimensions</h2></div><button onClick={() => fetch(`/api/analytics?campaignId=${encodeURIComponent(campaign.id)}&format=csv`, { headers }).then(async (response) => { if (!response.ok) return; const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `chatstreet-${campaign.id}-reconciliation.csv`; anchor.click(); URL.revokeObjectURL(url); })}>Export CSV</button></div><div className="reconciliation-table"><table><thead><tr><th>Date</th><th>Platform</th><th>Publisher</th><th>Line item</th><th>Creative</th><th>Placement/site</th><th>Widget loads</th><th>IDs matched</th></tr></thead><tbody>{analytics?.reconciliation.slice(0,30).map((row) => <tr key={[row.date,row.platform,row.publisher,row.lineItemId,row.creativeId,row.placementId,row.siteId].join("|")}><td>{row.date}</td><td>{row.platform}</td><td>{row.publisher}</td><td>{row.lineItemId || "—"}</td><td>{row.creativeId || "—"}</td><td>{row.placementId || row.siteId || "—"}</td><td>{row.widgetLoads}</td><td>{row.matchedImpressions}</td></tr>)}</tbody></table></div></div>
      </section>}

      {tab === "campaign" && <div className="studio-workspace"><section className="studio-editor"><div className="studio-title"><span>CAMPAIGN CONSOLE</span><h1>Build the conversation and its commercial rules.</h1><p>The live article always leads. Sponsorship appears only when the reader’s declared intent matches this brief.</p></div>
        <form onSubmit={save}><div className="studio-form-grid">
          {([['id','Campaign ID'],['name','Campaign name'],['advertiser','Advertiser'],['assistantName','Assistant name'],['ctaLabel','CTA label'],['ctaUrl','CTA URL']] as Array<[keyof Campaign,string]>).map(([key,label]) => <label key={key}>{label}<input value={campaign[key]} onChange={(e)=>field(key,e.target.value)} required /></label>)}
          <label>Status<select value={campaign.status} onChange={(e)=>field("status",e.target.value)}><option>active</option><option>paused</option><option>draft</option></select></label>
          <label>Accent<div className="color-input"><input type="color" value={campaign.accent} onChange={(e)=>field("accent",e.target.value)}/><input value={campaign.accent} onChange={(e)=>field("accent",e.target.value)}/></div></label>
          <label>Surface<div className="color-input"><input type="color" value={campaign.surface} onChange={(e)=>field("surface",e.target.value)}/><input value={campaign.surface} onChange={(e)=>field("surface",e.target.value)}/></div></label>
          {([['welcomeMessage','Fallback welcome',3],['context','Campaign context',5],['sponsorBrief','Sponsor brief and approved claims',7],['starterPrompts','Starter prompts · JSON array',3],['intentRules','Eligible intents · JSON array',3]] as Array<[keyof Campaign,string,number]>).map(([key,label,rows]) => <label className="wide" key={key}>{label}<textarea rows={rows} value={campaign[key]} onChange={(e)=>field(key,e.target.value)} /></label>)}
        </div><button className="studio-save">Save campaign</button><span className="studio-notice">{notice}</span></form>
      </section><aside className="studio-preview"><div className="preview-head"><div><small>LIVE PREVIEW</small><b>Responsive inline unit</b></div><span>Context-aware</span></div><iframe key={campaign.id+campaign.accent+campaign.surface} title="Campaign preview" src={`/widget?campaign=${campaign.id}&publisher=studio-preview&mode=inline&pageTitle=Live%20campaign%20preview`} /><p><i/>The published tag loads saved settings. Save before validating changes.</p></aside></div>}

      {tab === "delivery" && <section className="delivery-page"><div className="studio-title"><span>TAG DELIVERY</span><h1>One campaign, every buying path.</h1><p>Use the JavaScript tag for GAM and direct publishers. Use the sandboxed iframe creative for DV360 and TTD.</p></div><div className="delivery-status"><i/><div><small>PRODUCTION ORIGIN</small><b>chatstreet.theaudiencestreet.com</b></div><span>Live</span></div><div className="tag-grid"><Tag title="GAM / publisher JavaScript" label="RECOMMENDED" code={embedTag}/><Tag title="DV360 / TTD iframe" label="HTML5" code={dv360Tag}/><Tag title="Direct test URL" label="QA" code={`https://chatstreet.theaudiencestreet.com/widget?campaign=${campaign.id}&publisher=qa&mode=inline`}/></div></section>}
    </section>
  </main>;
}

function Tag({ title, label, code }: { title: string; label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return <article className="tag-card"><div><span>{label}</span></div><h2>{title}</h2><p>Campaign-specific production delivery code with persistent analytics.</p><pre>{code}</pre><button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); }}>{copied ? "Copied" : "Copy code"}</button></article>;
}
