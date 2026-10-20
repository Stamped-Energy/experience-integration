/** The Stamped logo as a vector: eight coral wedges on a transparent ground, so it sits cleanly on light and dark themes. */
import { logoPath } from "@/lib/mascot/engine";

const D = logoPath(100);
export function StampedMark({ size = 28, className, label = "Stamped" }: { size?: number; className?: string; label?: string }) {
  return <svg className={className} width={size} height={size} viewBox="-104 -104 208 208" role="img" aria-label={label}><path d={D} fill="var(--mascot-body, #F75440)" /></svg>;
}
