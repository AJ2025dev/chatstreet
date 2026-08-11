import type { Metadata } from "next";
import Widget from "./widget";
import "./widget.css";

export const metadata: Metadata = {
  title: "ChatStreet Widget",
  description: "Contextual conversational advertising by ChatStreet",
};

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  return <Widget initialQuery={params.toString()} />;
}
