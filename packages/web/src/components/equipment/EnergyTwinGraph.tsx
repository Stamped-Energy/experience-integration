"use client";

import { useMemo, useState } from "react";
import { energyTwinFixture, type TwinNode } from "@/fixtures/energy-twin";
import { Zap, ChevronDown, ChevronRight } from "@/components/ui/icons";
import { Panel } from "@/components/ui/primitives";

/** 2D expandable energy hierarchy - digital twin (no 3D). */
export function EnergyTwinGraph({ root = energyTwinFixture }: { root?: TwinNode }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    section_pyro: false,
    section_grind: false,
    section_util: false,
  });

  const visible = useMemo(() => flattenVisible(root, expanded), [root, expanded]);

  function toggle(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  return (
    <Panel
      data-energy-twin
      style={{ padding: 0, overflow: "hidden", minHeight: 420 }}
      aria-label="Plant energy hierarchy"
    >
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--forge-outline-variant)" }}>
        <p className="forge-eyebrow">Energy twin</p>
        <h3 className="forge-card-title">Plant power hierarchy</h3>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
          Sections collapse when dense - click a section node to expand equipment. Current load ·
          Normal production · Day shift.
        </p>
      </div>

      <div
        className="forge-scroll-thin"
        style={{
          padding: 24,
          overflow: "auto",
          background: "var(--forge-surface)",
          minHeight: 360,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 0, alignItems: "center", minWidth: 0 }}>
          {visible.map(({ node, depth, edge }) => (
            <div
              key={node.id}
              style={{
                display: "flex",
                alignItems: "stretch",
                marginLeft: depth * 28,
                gap: 12,
                marginBottom: 10,
                justifyContent: "center",
              }}
            >
              {depth > 0 ? (
                <div
                  style={{
                    width: 24,
                    borderLeft: "2px solid var(--forge-outline-variant)",
                    borderBottom: "2px solid var(--forge-outline-variant)",
                    borderBottomLeftRadius: 8,
                    marginTop: -8,
                    marginBottom: 20,
                    flexShrink: 0,
                  }}
                  title={
                    edge
                      ? `${edge.transferKw} kW${edge.lossPct != null ? ` · ${edge.lossPct}% unexplained` : ""}`
                      : undefined
                  }
                />
              ) : (
                <div style={{ width: 8 }} />
              )}
              <TwinCard
                node={node}
                expanded={!!expanded[node.id]}
                onToggle={
                  node.kind === "section" && node.children?.length
                    ? () => toggle(node.id)
                    : undefined
                }
              />
              {edge && depth > 0 ? (
                <span
                  style={{
                    alignSelf: "center",
                    fontSize: 11,
                    color: "var(--forge-on-surface-variant)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {edge.transferKw} kW
                  {edge.lossPct != null && edge.lossPct > 0
                    ? ` · ${edge.lossPct}% unexplained`
                    : ""}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function TwinCard({
  node,
  expanded,
  onToggle,
}: {
  node: TwinNode;
  expanded: boolean;
  onToggle?: () => void;
}) {
  const body = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <strong style={{ fontSize: 13, fontFamily: "var(--forge-font-display)" }}>{node.name}</strong>
        <span style={{ display: "inline-flex", color: "var(--forge-tertiary)" }}>
          {onToggle ? (
            expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <Zap size={14} />
          )}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--forge-on-surface-variant)" }}>
          kW
        </span>
        <span className="forge-num-display tabular" style={{ fontSize: 20 }}>
          {Number.isInteger(node.kw) ? node.kw : node.kw.toFixed(2)}
        </span>
      </div>
      {node.kind === "section" && node.children ? (
        <span style={{ fontSize: 11, color: "var(--forge-on-surface-variant)" }}>
          {expanded ? "Expanded" : `${node.children.length} assets - click to expand`}
        </span>
      ) : null}
    </>
  );

  const style = {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 6,
    minWidth: 180,
    maxWidth: 240,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid var(--forge-outline-variant)",
    background: "var(--forge-surface-container-lowest)",
    boxShadow: "var(--forge-shadow-card)",
    textAlign: "left" as const,
  };

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        data-twin-id={node.id}
        style={{ ...style, cursor: "pointer" }}
      >
        {body}
      </button>
    );
  }

  return (
    <div data-twin-id={node.id} style={style}>
      {body}
    </div>
  );
}

function flattenVisible(
  root: TwinNode,
  expanded: Record<string, boolean>,
  depth = 0,
): Array<{ node: TwinNode; depth: number; edge?: TwinNode["edgeFromParent"] }> {
  const row = { node: root, depth, edge: root.edgeFromParent };
  const kids = root.children ?? [];
  if (root.kind === "section" && !expanded[root.id]) {
    return [row];
  }
  return [
    row,
    ...kids.flatMap((c) => flattenVisible(c, expanded, depth + 1)),
  ];
}
