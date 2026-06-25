import { createContext, useContext, type ReactNode } from "react";

/**
 * Canonical Request Token.
 *
 * One synthetic request follows the user through the entire site. The Hero
 * issues it, Pipeline inspects it, Threat lists it, Analytics highlights it,
 * Network routes it on the globe, Layers passes it through each shield,
 * Confidence resolves it, Finale collapses it into the CTA. Subconsciously
 * the user follows ONE request through the platform.
 *
 * Values are deterministic (no Math.random) so SSR and client agree and the
 * same hash appears in every section.
 */
export type RequestToken = {
  id: string;          // short hex stamp, e.g. "67a2"
  hash: string;        // full ja4-like fingerprint
  url: string;         // canonical destination
  short: string;       // short slug
  asn: string;
  geo: string;
  ua: string;
  ip: string;
  score: number;       // 0..1 risk
  verdict: "ALLOW" | "CHALLENGE" | "DENY";
  pop: string;         // edge pop code
  ms: number;          // decision latency
};

const CANONICAL: RequestToken = {
  id: "67a2",
  hash: "t13d1516h2_8daaf6152771_b1ff8ab2d16f",
  url: "https://acme.com/q4/launch?utm=press",
  short: "aegis.to/q4-launch",
  asn: "AS13335",
  geo: "US-CA · SFO",
  ua: "Chrome/126 · macOS",
  ip: "104.28.7.91",
  score: 0.04,
  verdict: "ALLOW",
  pop: "SFO-04",
  ms: 11.4,
};

const TokenCtx = createContext<RequestToken>(CANONICAL);

export function TokenProvider({
  children,
  token = CANONICAL,
}: {
  children: ReactNode;
  token?: RequestToken;
}) {
  return <TokenCtx.Provider value={token}>{children}</TokenCtx.Provider>;
}

export function useRequestToken(): RequestToken {
  return useContext(TokenCtx);
}
