export type Beat = {
  id: number;
  name: string;
  range: [number, number];
  headline: string;
  subtitle: string;
  align: "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";
};

// 12 beats, each align is asymmetric on purpose — no two adjacent acts share alignment.
export const BEATS: Beat[] = [
  { id: 1,  name: "Origin",      range: [0.00, 0.08], headline: "Before the link, <em>a perimeter</em>.",         subtitle: "I — Origin",      align: "bl" },
  { id: 2,  name: "Approach",    range: [0.08, 0.16], headline: "Something approaches, <em>silent</em>.",         subtitle: "II — Approach",   align: "mr" },
  { id: 3,  name: "Threshold",   range: [0.16, 0.26], headline: "At the edge, <em>a decision is made</em>.",      subtitle: "III — Threshold", align: "tc" },
  { id: 4,  name: "Material",    range: [0.26, 0.36], headline: "Every link, <em>carved with intent</em>.",       subtitle: "IV — Material",   align: "br" },
  { id: 5,  name: "Pattern",     range: [0.36, 0.46], headline: "Routed at the edge, <em>millions a second</em>.",subtitle: "V — Pattern",     align: "ml" },
  { id: 6,  name: "Light",       range: [0.46, 0.56], headline: "Held under <em>a single shaft of light</em>.",   subtitle: "VI — Light",      align: "bc" },
  { id: 7,  name: "Fracture",    range: [0.56, 0.66], headline: "The bot meets <em>the model</em>.",              subtitle: "VII — Fracture",  align: "tr" },
  { id: 8,  name: "Lattice",     range: [0.66, 0.74], headline: "Threats fall into <em>place</em>.",              subtitle: "VIII — Lattice",  align: "bl" },
  { id: 9,  name: "Plan",        range: [0.74, 0.82], headline: "Drawn from above, <em>in real time</em>.",       subtitle: "IX — Plan",       align: "mr" },
  { id: 10, name: "Sanctuary",   range: [0.82, 0.90], headline: "Your audience arrives, <em>unharmed</em>.",       subtitle: "X — Sanctuary",   align: "tl" },
  { id: 11, name: "Proof",       range: [0.90, 0.96], headline: "<em>“Shortened links, finally trusted.”</em>",   subtitle: "XI — Proof",      align: "bc" },
  { id: 12, name: "Invitation",  range: [0.96, 1.00], headline: "Route your first link.",                          subtitle: "XII — Invitation",align: "tc" },
];

export function activeBeatIndex(p: number) {
  for (let i = BEATS.length - 1; i >= 0; i--) {
    if (p >= BEATS[i].range[0]) return i;
  }
  return 0;
}

export function alignClass(a: Beat["align"]) {
  // returns flex alignment + padding
  const v = a[0]; const h = a[1];
  const vert = v === "t" ? "items-start pt-[14vh]" : v === "b" ? "items-end pb-[16vh]" : "items-center";
  const hor  = h === "l" ? "justify-start pl-[7vw]" : h === "r" ? "justify-end pr-[7vw]" : "justify-center px-[7vw]";
  return `${vert} ${hor}`;
}
