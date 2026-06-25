import type { Metadata } from "next";
import "@fontsource/geist-sans";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

export const metadata: Metadata = {
  title: {
    default: "Aegis Route — Compliance-Shielded Link Routing",
    template: "%s | Aegis Route",
  },
  description:
    "Enterprise-grade, compliance-shielded link routing SaaS. Real-time ML traffic classification, IP rate limiting, full GDPR/CCPA/HIPAA compliance, and sub-30ms global edge routing.",
  keywords: [
    "link routing", "compliance", "SaaS", "security", "machine learning",
    "edge computing", "GDPR", "CCPA", "URL routing", "bot protection",
  ],
  authors: [{ name: "Aegis Route" }],
  creator: "Aegis Route",
  metadataBase: new URL("https://aegis-route.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aegis-route.com",
    title: "Aegis Route — Compliance-Shielded Link Routing",
    description: "Enterprise-grade link routing with real-time ML traffic classification and full compliance shielding.",
    siteName: "Aegis Route",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aegis Route — Compliance-Shielded Link Routing",
    description: "Enterprise-grade link routing with real-time ML traffic classification.",
    creator: "@aegisroute",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden selection:bg-white/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
