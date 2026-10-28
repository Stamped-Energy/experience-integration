import type { OeeLossNode } from "@/lib/demo/capabilityScreens";

function LossNode({ node, depth = 0 }: { node: OeeLossNode; depth?: number }) {
  const hasChildren = node.children && node.children.length > 0;
  return (
    <li>
      <span style={{ fontWeight: depth === 0 ? 600 : 400 }}>{node.name}</span>
      <span className="min">{node.lossMin} min</span>
      {hasChildren ? (
        <ul>
          {node.children!.map((c) => (
            <LossNode key={c.id} node={c} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function LossTree({ root }: { root: OeeLossNode }) {
  return (
    <ul className="loss-tree">
      <LossNode node={root} />
    </ul>
  );
}
