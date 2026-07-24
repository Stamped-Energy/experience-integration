"use client";

import { useMemo, useState } from "react";
import type { AnalystContextEnvelope } from "@/lib/types";
import {
  DEMO_PLANT,
  investigationsFixture,
  type DemoInvestigation,
} from "@/fixtures/demo";
import {
  confirmActionGate,
  fixtureAnalystReply,
  proposeActionFromReply,
  type AnalystMessage,
  type ProposedAction,
} from "@/lib/analyst-context";
import {
  ForgeButton,
  ForgeButtonGroup,
  Panel,
  StatusChip,
} from "@/components/ui/primitives";

function seedMessages(inv: DemoInvestigation): AnalystMessage[] {
  return inv.seedMessages.map((m, i) => ({
    id: `${inv.id}_seed_${i}`,
    role: m.role,
    content: m.content,
    citations:
      m.role === "assistant"
        ? [
            {
              id: `cite_${inv.id}`,
              title: inv.focus,
              path: "H" as const,
              snippet: inv.summary,
            },
          ]
        : undefined,
  }));
}

const BASE_ENVELOPE: AnalystContextEnvelope = {
  orgId: DEMO_PLANT.orgId,
  plantId: DEMO_PLANT.plantId,
  userId: "user_demo",
  role: "energy_manager",
  routeId: "analyst",
  screenTitle: "Ask Analyst",
  visibleSummary: ["Mode B workspace", "Citations required"],
  focusEntity: { type: "alarm", id: "alm_1001" },
};

const QUICK = [
  { id: "q1", label: "Summarize open alarms", prompt: "Summarize open critical and warning alarms for this plant." },
  { id: "q2", label: "Explain top prescription", prompt: "Explain the highest-impact open prescription and evidence." },
  { id: "q3", label: "Peak demand last week", prompt: "What drove peak demand last week versus CMD?" },
  { id: "q4", label: "Closure status", prompt: "How is prescription closure tracking this billing cycle?" },
] as const;

/** Mode B — Script-style center chat + right context rail. */
export function AnalystWorkspace() {
  const [activeInv, setActiveInv] = useState(investigationsFixture[0]!.id);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AnalystMessage[]>(() =>
    seedMessages(investigationsFixture[0]!),
  );
  const [proposal, setProposal] = useState<ProposedAction | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const envelope = useMemo(() => {
    const inv = investigationsFixture.find((i) => i.id === activeInv)!;
    const [type, id] = inv.focus.split(":") as ["alarm" | "prescription", string];
    return {
      ...BASE_ENVELOPE,
      focusEntity: { type, id },
      screenTitle: inv.title,
      visibleSummary: [inv.summary, DEMO_PLANT.plantName],
    } satisfies AnalystContextEnvelope;
  }, [activeInv]);

  const citations = messages.flatMap((m) => m.citations ?? []);

  function selectInv(id: string) {
    const inv = investigationsFixture.find((i) => i.id === id)!;
    setActiveInv(id);
    setMessages(seedMessages(inv));
    setProposal(null);
    setStatus(null);
    setConfirming(false);
    setStarted(true);
  }

  function send(text?: string) {
    const q = (text ?? draft).trim();
    if (!q) return;
    setStarted(true);
    const userMsg: AnalystMessage = { id: `u_${Date.now()}`, role: "user", content: q };
    const reply = fixtureAnalystReply(envelope, q);
    setMessages((prev) => [...prev, userMsg, reply]);
    setProposal(proposeActionFromReply(envelope, reply));
    setConfirming(false);
    setDraft("");
  }

  function confirmHandoff() {
    const gate = confirmActionGate({ proposed: proposal, confirmed: true });
    if (!gate.allowed || !proposal) {
      setStatus(gate.reason);
      return;
    }
    setStatus(`Handoff confirmed: ${proposal.label} → ${proposal.targetId} (not sent upstream)`);
    setProposal(null);
    setConfirming(false);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 0.9fr)",
        gap: 16,
        minHeight: 520,
      }}
      className="analyst-grid"
      data-analyst-mode="B"
    >
      <Panel style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 520 }}>
        {!started && messages.length <= 2 ? (
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--forge-font-display)",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              Welcome to Ask Analyst
            </h2>
            <p style={{ margin: "8px 0 0", color: "var(--forge-on-surface-variant)", fontSize: 14 }}>
              Investigate alarms, prescriptions, and demand with removable context. Actions to L5
              always require confirm.
            </p>
            <div style={{ marginTop: 20 }}>
              <ForgeButtonGroup aria-label="Quick prompts">
                {QUICK.map((q) => (
                  <ForgeButton key={q.id} variant="ghost" onClick={() => send(q.prompt)}>
                    {q.label}
                  </ForgeButton>
                ))}
              </ForgeButtonGroup>
            </div>
          </div>
        ) : null}

        <div
          style={{
            flex: 1,
            background: "var(--forge-surface-container-low)",
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            overflow: "auto",
            minHeight: 200,
          }}
          aria-live="polite"
        >
          {messages.map((m) => (
            <div key={m.id} style={{ marginBottom: 14 }}>
              <strong style={{ fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
                {m.role === "user" ? "You" : "Analyst"}
              </strong>
              <p style={{ margin: "4px 0 0", lineHeight: 1.5 }}>{m.content}</p>
            </div>
          ))}
        </div>

        <div
          style={{
            border: "1px solid var(--forge-outline-variant)",
            borderRadius: 14,
            padding: 12,
            background: "var(--forge-surface-container-lowest)",
          }}
        >
          <input
            aria-label="Ask full analyst"
            placeholder="Ask about alarms, prescriptions, demand…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: 15,
              fontFamily: "var(--forge-font-body)",
              background: "transparent",
              minHeight: 40,
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <ForgeButton variant="primary" onClick={() => send()}>
              Send
            </ForgeButton>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "var(--forge-on-surface-variant)" }}>
          Fixture Auto replies until live L4 HTTP is enabled. Citations required for claims.
        </p>
      </Panel>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="forge-card-title">Investigations ({investigationsFixture.length})</h2>
          </div>
          <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
            {investigationsFixture.map((inv) => (
              <li key={inv.id}>
                <button
                  type="button"
                  onClick={() => selectInv(inv.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid var(--forge-outline-variant)",
                    background:
                      activeInv === inv.id
                        ? "var(--forge-primary-dim)"
                        : "var(--forge-surface-container-lowest)",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  <span style={{ display: "block" }}>{inv.title}</span>
                  <span
                    style={{
                      display: "block",
                      marginTop: 4,
                      fontWeight: 500,
                      fontSize: 11,
                      color: "var(--forge-on-surface-variant)",
                    }}
                  >
                    {inv.summary}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2 className="forge-card-title">Sources & context</h2>
          {citations.length === 0 ? (
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              Citations appear here (Path H / Path W).
            </p>
          ) : (
            <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
              {citations.map((c) => (
                <li key={c.id}>
                  <StatusChip tone="info">Path {c.path ?? "H"}</StatusChip> {c.title}
                </li>
              ))}
            </ul>
          )}

          {proposal ? (
            <div style={{ marginTop: 16 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>Action handoff</p>
              <p style={{ margin: "6px 0 0", fontSize: 13 }}>{proposal.summary}</p>
              {!confirming ? (
                <div style={{ marginTop: 10 }}>
                  <ForgeButton variant="secondary" onClick={() => setConfirming(true)}>
                    Preview {proposal.label}
                  </ForgeButton>
                </div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <ForgeButtonGroup aria-label="Confirm L5 handoff">
                    <ForgeButton variant="primary" onClick={confirmHandoff}>
                      Confirm send to L5
                    </ForgeButton>
                    <ForgeButton variant="ghost" onClick={() => setConfirming(false)}>
                      Cancel
                    </ForgeButton>
                  </ForgeButtonGroup>
                </div>
              )}
            </div>
          ) : null}

          {status ? (
            <p role="status" style={{ margin: "12px 0 0", fontSize: 12, color: "var(--forge-good)" }}>
              {status}
            </p>
          ) : null}
        </Panel>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .analyst-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
