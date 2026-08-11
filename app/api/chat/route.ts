import { DEFAULT_CAMPAIGN, cleanString, getCampaign, getModel, getOpenAIKey, json } from "../../../lib/chatstreet";
import { hasSupabase, supabaseRest } from "../../../lib/supabase";

type ChatMessage = { role: "user" | "assistant"; text: string };

function fallback(message: string, advertiser: string, pageTitle = "", pageContext = "") {
  const lower = message.toLowerCase();
  const article = pageContext.replace(/\s+/g, " ").trim();
  const articleRelevantToSponsor = /\b(ev|electric vehicle|charging|battery|petrol|commute|car|vehicle)\b/i.test(`${message} ${article}`);
  const intent = lower.includes("charg")
    ? "charging"
    : lower.includes("cost") || lower.includes("petrol") || lower.includes("sav")
      ? "ownership cost"
      : lower.includes("range")
        ? "EV range"
        : lower.includes("commut")
          ? "daily commute"
          : "EV consideration";
  const campaignAnswer =
    intent === "charging"
      ? "If you have dedicated parking, overnight AC charging will usually cover daily city use. Public fast charging is most useful as a top-up for longer journeys."
      : intent === "ownership cost"
        ? "Compare the purchase price, annual distance, electricity tariff, insurance and expected resale value over five years—not fuel cost alone."
        : intent === "EV range"
          ? "For mostly urban driving, dependable real-world range and charging access matter more than the largest advertised number. Frequent intercity travel increases the buffer you need."
          : "Start with your daily distance, overnight charging access and occasional long trips. Those three facts usually narrow the right EV profile quickly.";
  const excerpt = article.slice(0, 460).replace(/\s+\S*$/, "");
  const answer = article && !articleRelevantToSponsor
    ? /summari[sz]e|what.*about|main point/i.test(lower)
      ? `${pageTitle ? `${pageTitle}: ` : ""}${excerpt}${article.length > excerpt.length ? "…" : ""}`
      : `Based on this article, ${excerpt.charAt(0).toLowerCase()}${excerpt.slice(1)}${article.length > excerpt.length ? "…" : ""}`
    : campaignAnswer;
  return {
    answer,
    intent,
    confidence: 0.78,
    sponsored: {
      show: articleRelevantToSponsor,
      label: "Sponsored match",
      advertiser,
      message: `${advertiser} is one relevant option, with 410 km certified range, an 8-year battery warranty and home-charger assessment.`,
      reasons: ["410 km range", "8-year warranty", "Home charger"],
      ctaLabel: "Book a test drive",
    },
    quickReplies: article && !articleRelevantToSponsor
      ? ["What is the key takeaway?", "Explain this simply", "What should I consider next?"]
      : ["Estimate my savings", "What about charging?", "Compare variants"],
    mode: "fallback",
  };
}

function extractText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output as Array<Record<string, unknown>>) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content as Array<Record<string, unknown>>) {
      if (typeof part.text === "string") return part.text;
    }
  }
  return "";
}

export function OPTIONS() {
  return json({});
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const message = cleanString(body.message, 1000);
  if (!message) return json({ error: "message is required" }, { status: 400 });
  const campaign = await getCampaign(cleanString(body.campaignId, 80) || DEFAULT_CAMPAIGN.id);
  const pageTitle = cleanString(body.pageTitle, 300);
  const pageContext = cleanString(body.pageContext, 6000);
  const sessionId = cleanString(body.sessionId, 120);
  const persistMessage = async (role: "user" | "assistant", content: string, details: Record<string, unknown> = {}) => {
    if (!hasSupabase() || !sessionId) return;
    try {
      await supabaseRest("messages", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          session_id: sessionId,
          campaign_id: campaign.id,
          role,
          content,
          intent: details.intent || null,
          sponsored: details.sponsored === true,
          model: details.model || null,
          latency_ms: details.latencyMs || null,
        }),
      });
    } catch {
      // Chat delivery must continue if analytics storage is temporarily unavailable.
    }
  };
  await persistMessage("user", message);
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    console.error("ChatStreet OpenAI key is unavailable in this deployment");
    const result = fallback(message, campaign.advertiser, pageTitle, pageContext);
    await persistMessage("assistant", result.answer, { intent: result.intent, sponsored: result.sponsored.show });
    return json(result);
  }

  const history = (Array.isArray(body.history) ? body.history : [])
    .slice(-8)
    .map((item: ChatMessage) => `${item.role}: ${cleanString(item.text, 800)}`)
    .join("\n");
  const instructions = `You are ChatStreet, a concise contextual assistant embedded on a publisher page.
First answer the user's genuine question using the live article context. If the article context does not contain the answer, say so briefly instead of guessing. Advertising must never distort the answer.
Then decide whether the declared intent genuinely matches the sponsor brief. Never infer sensitive traits. Never fabricate facts, prices, availability or comparative claims.
If relevant, include one clearly separated sponsored recommendation. If not relevant, set sponsored.show false.
Campaign context: ${campaign.context}
Live article title: ${pageTitle || "Unavailable"}
Live article text: ${pageContext || "Unavailable; rely only on campaign context and the user's declared question."}
Sponsor brief: ${campaign.sponsorBrief}
Return valid JSON matching the requested schema.`;

  const startedAt = Date.now();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      reasoning: { effort: "low" },
      instructions,
      input: `${history}\nuser: ${message}`,
      max_output_tokens: 700,
      text: {
        format: {
          type: "json_schema",
          name: "chatstreet_response",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              answer: { type: "string" },
              intent: { type: "string" },
              confidence: { type: "number" },
              sponsored: {
                type: "object",
                additionalProperties: false,
                properties: {
                  show: { type: "boolean" },
                  label: { type: "string" },
                  advertiser: { type: "string" },
                  message: { type: "string" },
                  reasons: { type: "array", items: { type: "string" } },
                  ctaLabel: { type: "string" },
                },
                required: ["show", "label", "advertiser", "message", "reasons", "ctaLabel"],
              },
              quickReplies: { type: "array", items: { type: "string" } },
            },
            required: ["answer", "intent", "confidence", "sponsored", "quickReplies"],
          },
        },
      },
    }),
  });
  if (!response.ok) {
    console.error("ChatStreet OpenAI request failed", { status: response.status, model: getModel() });
    const result = fallback(message, campaign.advertiser, pageTitle, pageContext);
    await persistMessage("assistant", result.answer, { intent: result.intent, sponsored: result.sponsored.show });
    return json({ ...result, mode: "fallback", upstreamStatus: response.status });
  }
  const payload = (await response.json()) as Record<string, unknown>;
  try {
    const result = JSON.parse(extractText(payload));
    await persistMessage("assistant", result.answer, {
      intent: result.intent,
      sponsored: result.sponsored?.show === true,
      model: getModel(),
      latencyMs: Date.now() - startedAt,
    });
    return json({ ...result, mode: "live", model: getModel() });
  } catch {
    console.error("ChatStreet OpenAI response was not valid structured JSON", { model: getModel() });
    const result = fallback(message, campaign.advertiser, pageTitle, pageContext);
    await persistMessage("assistant", result.answer, { intent: result.intent, sponsored: result.sponsored.show });
    return json(result);
  }
}
