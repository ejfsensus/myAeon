import type { Metadata } from "next";
import PrivacyContent from "./PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How myAeon handles birth details, AI readings, narration, Zeus conversations, cookies and your UK GDPR rights. Operated by Ethan James Farrell, Acuity Institute.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
