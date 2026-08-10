import type { Metadata } from "next";
import Studio from "./studio";

export const metadata: Metadata = {
  title: "ChatStreet Studio",
  description: "Configure and measure contextual conversational campaigns.",
};

export default function StudioPage() {
  return <Studio />;
}
