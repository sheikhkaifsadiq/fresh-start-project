import { createFileRoute } from "@tanstack/react-router";
import { CinematicLanding } from "../components/cinematic/landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AegisRoute — A smarter route for every link." },
      {
        name: "description",
        content:
          "Edge-routed URL shortening with AI threat detection and real-time analytics. Every redirect inspected, scored, and decided in under 12ms.",
      },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#02080d" },
      { property: "og:title", content: "AegisRoute — A smarter route for every link." },
      {
        property: "og:description",
        content:
          "Edge-routed URL shortening with AI threat detection and real-time analytics.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aegisroute.com/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AegisRoute — A smarter route for every link." },
      {
        name: "twitter:description",
        content:
          "Edge-routed URL shortening with AI threat detection. Every redirect decided in under 12ms.",
      },
    ],
    links: [{ rel: "canonical", href: "https://aegisroute.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AegisRoute",
          applicationCategory: "SecurityApplication",
          operatingSystem: "Web",
          url: "https://aegisroute.com/",
          description:
            "Edge-routed URL shortening with AI threat detection and real-time analytics.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: CinematicLanding,
});
