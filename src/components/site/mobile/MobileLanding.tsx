/**
 * @file src/components/site/mobile/MobileLanding.tsx
 * @description Phone-only composition (≤720px). Five sections, each a
 * dedicated module under ./. The desktop cinematic tree (RoutingField,
 * Scene framing, SectionGlyph, CursorRing, HandoffToken, globe) is never
 * imported here — phones don't pay for it.
 */

import { MobileBar }      from "./Bar";
import { MobileHero }     from "./Hero";
import { MobilePipeline } from "./Pipeline";
import { MobileThreat }   from "./Threat";
import { MobileNetwork }  from "./Network";
import { MobileCta }      from "./Cta";

export function MobileLanding() {
  return (
    <div className="m-root">
      <MobileBar />
      <main>
        <MobileHero />
        <div id="pipeline"><MobilePipeline /></div>
        <div id="threat"><MobileThreat /></div>
        <div id="network"><MobileNetwork /></div>
        <div id="cta"><MobileCta /></div>
      </main>
    </div>
  );
}
