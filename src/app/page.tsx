import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";
import { questions } from "@/components/landing/faq";
import { OG_IMAGE, ORGANIZATION_ID, SITE_NAME, SITE_URL } from "@/lib/seo/site";

const DESCRIPTION =
  "Explore your sky, understand your patterns and meet the moment with myAeon. Personal astrology readings, birth charts, a 3D solar system and Zeus.";

export const metadata: Metadata = {
  title: { absolute: "myAeon · Personal Astrology Readings & Birth Charts" },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    title: "myAeon · A little perspective. A wider sky.",
    description:
      "A personal space for cosmic exploration and thoughtful reflection: AI-generated readings, natal and transit charts, a 3D solar system and conversations with Zeus.",
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "myAeon · A little perspective. A wider sky.",
    description:
      "Personal astrology readings, birth charts, a 3D solar system and conversations with Zeus.",
    images: [OG_IMAGE.url],
  },
};

/* Structured data built only from facts stated on the landing page. */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "Acuity Institute",
      url: "https://acuity.institute/",
      logo: "https://acuity.institute/icon-512.png",
      founder: {
        "@type": "Person",
        name: "Ethan James Farrell",
        url: "https://ethan-james.co.uk/",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      inLanguage: "en-GB",
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: `${SITE_URL}/app`,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Any (web browser)",
      description:
        "A reflective astrology workspace: personal AI-generated readings across love, purpose, body and inner world; natal and transit chart wheels; Standard and Deep birth profiles; an interactive flat and 3D solar system; narrated listening and PDF export; and voice or text conversations with Zeus about your chart.",
      image: OG_IMAGE.url,
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: questions.map((item) => ({
        "@type": "Question",
        name: item.title,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPage />
    </>
  );
}
