import { StampedMark } from "@/components/ui/icons";

export function StampedLogo({ size = 30 }: { size?: number }) {
  return <StampedMark size={size} className="forge-shell__logo" />;
}
