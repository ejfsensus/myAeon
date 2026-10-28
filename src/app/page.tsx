import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "myAeon — A little perspective. A wider sky.",
  description:
    "Explore your sky, understand your patterns and meet the moment with myAeon. Personal astrological readings, birth charts, a 3D solar system and conversations with Zeus.",
  openGraph: {
    title: "myAeon — A little perspective. A wider sky.",
    description:
      "A personal space for cosmic exploration and thoughtful reflection.",
    type: "website",
  },
};

export default function Page() {
  return <LandingPage />;
}
