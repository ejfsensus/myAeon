import type { Metadata } from "next";
import Home from "../Home";
export const metadata: Metadata = {
  title: "Explore your sky — myAeon",
  description:
    "Open your personal cosmic workspace: readings, birth charts, planetary exploration and conversations with Zeus.",
};
export const dynamic = "force-dynamic";
export default function Page() {
  const initialDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return <Home initialDate={initialDate} />;
}
