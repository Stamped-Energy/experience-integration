"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listPeople,
  type NotifyPersonDto,
} from "@/lib/assignments-api";
import {
  recommendAssigneesFromPeople,
} from "@/lib/assign-recommend";
import { EmptyUpstreamState } from "@/components/ui/SourceIndicator";
import {
  GhostButton,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
} from "@/components/ui/primitives";

/** Assign sheet: 2–3 recommended people + browse full notify roster from BFF. */
export function AssignAssigneeSheet({
  open,
  onClose,
  area,
  assetId,
  title,
  onAssign,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  area?: string;
  assetId?: string;
  title: string;
  onAssign: (person: NotifyPersonDto) => void;
  busy?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const [people, setPeople] = useState<NotifyPersonDto[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadState("loading");
    setLoadError(null);
    setShowAll(false);
    void listPeople()
      .then((res) => {
        if (cancelled) return;
        setPeople(res.people);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPeople([]);
        setLoadState("unavailable");
        setLoadError(err instanceof Error ? err.message : "Failed to load people");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const recommended = useMemo(
    () => recommendAssigneesFromPeople(people, { area, assetId, limit: 3 }),
    [people, area, assetId],
  );
  const all = useMemo(
    () => people.filter((p) => p.whatsappEnabled),
    [people],
  );

  if (!open) return null;

  const list = showAll ? all : recommended;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Assign person"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 55,
        background: "rgba(25, 28, 26, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Panel
        style={{
          width: "min(520px, 100%)",
          maxHeight: "85vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p className="forge-eyebrow">Assign</p>
            <h2 className="forge-card-title" style={{ fontSize: 18 }}>
              {title}
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              {showAll
                ? "Everyone who can be notified"
                : "Recommended from Assignments matrix (2–3)"}
            </p>
          </div>
          <GhostButton onClick={onClose} disabled={busy}>
            Close
          </GhostButton>
        </div>

        {loadState === "loading" ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Loading notify roster…
          </p>
        ) : loadState === "unavailable" ? (
          <EmptyUpstreamState
            title="Notify roster unavailable"
            detail={loadError ?? "Sign in and ensure plant membership."}
          />
        ) : list.length === 0 ? (
          <EmptyUpstreamState
            title="No people to assign"
            detail="Add WhatsApp-enabled people under Assignments, then try again."
          />
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {list.map((p) => (
              <li key={p.id}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--forge-outline-variant)",
                    background: "var(--forge-surface-container-lowest)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{p.name}</strong>
                      <StatusChip tone="info">{p.role.replaceAll("_", " ")}</StatusChip>
                    </div>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 12,
                        color: "var(--forge-on-surface-variant)",
                      }}
                    >
                      {p.areas.join(" · ") || "No areas"} · {p.phoneMasked}
                    </p>
                  </div>
                  <PrimaryButton onClick={() => onAssign(p)} disabled={busy}>
                    Assign
                  </PrimaryButton>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="forge-btn-row">
          {loadState === "ready" && all.length > 0 ? (
            !showAll ? (
              <SecondaryButton onClick={() => setShowAll(true)} disabled={busy}>
                Browse all people
              </SecondaryButton>
            ) : (
              <GhostButton onClick={() => setShowAll(false)} disabled={busy}>
                Show recommendations
              </GhostButton>
            )
          ) : null}
          <GhostButton onClick={onClose} disabled={busy}>
            Cancel
          </GhostButton>
        </div>
      </Panel>
    </div>
  );
}
