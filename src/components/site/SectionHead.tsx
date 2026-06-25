import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

type Props = {
  num: string;
  kicker: string;
  title: ReactNode;
  body?: ReactNode;
};

export function SectionHead({ num, kicker, title, body }: Props) {
  return (
    <div className="section-head">
      <div className="eyebrow-col">
        <Reveal>
          <div className="num">{num}</div>
          <div className="kicker" style={{ marginTop: 14 }}>{kicker}</div>
        </Reveal>
      </div>
      <div>
        <Reveal delay={120}>
          <h2>{title}</h2>
        </Reveal>
        {body && <Reveal delay={220}><p>{body}</p></Reveal>}
      </div>
    </div>
  );
}
