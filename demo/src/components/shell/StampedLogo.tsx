import Image from "next/image";

export function StampedLogo({ size = 30 }: { size?: number }) {
  return (
    <span
      className="forge-shell__logo-frame"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src="/stamped-logo.png"
        alt=""
        width={size}
        height={size}
        priority
        className="forge-shell__logo-img"
      />
    </span>
  );
}
