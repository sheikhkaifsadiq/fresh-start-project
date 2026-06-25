import type { ReactNode, AnchorHTMLAttributes } from "react";
import { useMagnetic } from "../../lib/motion";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode };

export function MagneticLink({ children, className = "", ...rest }: Props) {
  const ref = useMagnetic<HTMLAnchorElement>(0.3, 140);
  return (
    <span className="magnetic">
      <a ref={ref} className={`magnetic-inner ${className}`} {...rest}>
        {children}
      </a>
    </span>
  );
}
