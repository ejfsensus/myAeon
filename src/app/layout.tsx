import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo/site";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "myAeon · Personal Astrology Readings & Birth Charts",
    template: "%s · myAeon",
  },
  description:
    "myAeon is a reflective astrology app: personal AI-generated readings, natal and transit charts, an interactive 3D solar system and conversations with Zeus.",
  keywords: ["astrology", "birth chart", "natal chart", "astrology reading", "solar system", "zodiac"],
  /* Self-referencing canonical for every route; pages may override. */
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_GB",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
  applicationName: "myAeon",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "myAeon",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/favicon-light-32x32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#050616",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-astral-deep text-white`}
      >
        <div className="fallback-stars" aria-hidden />
        {children}
      </body>
    </html>
  );
}
