import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ChatStreet Studio",
  description: "Configure and measure contextual conversational campaigns.",
};

export default function StudioPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f4f0e7", color: "#15241e" }}>
      <section style={{ width: "min(620px, 100%)", padding: "48px", border: "1px solid #d9ddd4", borderRadius: 24, background: "#fbf8f0" }}>
        <small style={{ color: "#6b801e", fontWeight: 800, letterSpacing: ".12em" }}>CHATSTREET STUDIO</small>
        <h1 style={{ margin: "18px 0 14px", fontSize: "clamp(38px, 7vw, 68px)", lineHeight: .95, letterSpacing: "-.055em" }}>Campaign controls are protected.</h1>
        <p style={{ color: "#58655f", fontSize: 17, lineHeight: 1.6 }}>The public conversational ad demo is live. Campaign editing and detailed analytics will be enabled after authenticated administrator access and persistent storage are connected.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 18, padding: "12px 18px", borderRadius: 999, background: "#173f32", color: "white", textDecoration: "none", fontWeight: 700 }}>Return to ChatStreet</Link>
      </section>
    </main>
  );
}
