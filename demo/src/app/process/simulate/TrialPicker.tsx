"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function TrialPicker({
  options,
  activeId,
}: {
  options: { id: string; label: string }[];
  activeId: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <label className="field" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span className="label">Candidate</span>
      <select
        aria-label="Synthetic trial candidate"
        value={activeId}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("trial", e.target.value);
          router.push(`/process/simulate?${next.toString()}`);
        }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
