import type { ReactNode } from "react";

const NUM_RE =
  /(\d[\d,.]*\s*(?:kW|kWh|kVA|MWh|bar|min|m³|%|L|k)?|₹[\d,.]+(?:L|k)?(?:\s*\/\s*(?:mo|yr))?)/;

/** Bold numbers, units, and currency in running text. */
export function emphasizeNumbers(text: string): ReactNode {
  const parts = text.split(NUM_RE);
  if (parts.length <= 1) return text;
  return parts.map((part, i) =>
    part && NUM_RE.test(part) ? (
      <strong key={i} className="rx-emph-num">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/** Bold lead label before colon, then emphasize numbers in the rest. */
export function emphasizeLead(text: string): ReactNode {
  const colon = text.indexOf(":");
  if (colon > 0 && colon < 40) {
    return (
      <>
        <strong className="rx-emph-lead">{text.slice(0, colon + 1)}</strong>
        {emphasizeNumbers(text.slice(colon + 1))}
      </>
    );
  }
  return emphasizeNumbers(text);
}

/** Bold first clause before em-dash or arrow. */
export function emphasizeCause(text: string): ReactNode {
  const split = text.split(/\s*(→|-)\s*/);
  if (split.length >= 3) {
    return (
      <>
        <strong className="rx-emph-lead">{split[0]}</strong>
        {split[1]}
        {emphasizeNumbers(split.slice(2).join(" "))}
      </>
    );
  }
  return emphasizeNumbers(text);
}
