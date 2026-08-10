import type { Metadata } from "next";
import Widget from "./widget";
import "./widget.css";

export const metadata: Metadata = {
  title: "ChatStreet Widget",
  description: "Contextual conversational advertising by ChatStreet",
};

export default function WidgetPage() {
  return <Widget />;
}
