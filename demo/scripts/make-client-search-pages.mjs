#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appDir = path.join(root, "src/app");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name === "page.tsx") out.push(p);
  }
  return out;
}

function gitShow(rel) {
  try {
    return execSync(`git show HEAD:${rel}`, { cwd: path.join(root, ".."), encoding: "utf8" });
  } catch {
    return fs.readFileSync(path.join(root, rel.replace(/^demo\//, "")), "utf8");
  }
}

for (const pagePath of walk(appDir)) {
  const relFromRepo = `demo/${path.relative(root, pagePath).replace(/\\/g, "/")}`;
  let src = gitShow(relFromRepo);
  if (!src.includes("searchParams")) continue;

  const dir = path.dirname(pagePath);
  const viewPath = path.join(dir, "page-view.tsx");

  const metaMatch = src.match(/export const metadata[\s\S]*?;\n/);
  const meta = metaMatch ? metaMatch[0] : "";
  const gmetaMatch = src.match(/export async function generateMetadata[\s\S]*?\n\}\n/);
  const gmeta = gmetaMatch ? gmetaMatch[0] : "";

  let view = src;
  view = view.replace(/\nexport const metadata[\s\S]*?;\n/g, "\n");
  view = view.replace(/\nexport async function generateMetadata[\s\S]*?\n\}\n/g, "\n");

  if (!view.startsWith('"use client"')) {
    view = `"use client";\n\nimport { useParams, useSearchParams } from "next/navigation";\n${view}`;
  }

  view = view.replace(
    /export default async function (\w+)\(\{ searchParams \}: \{ searchParams: Promise<[^>]+> \}\)/g,
    "export default function $1()",
  );
  view = view.replace(
    /export default async function (\w+)\(\{ params, searchParams \}: \{ params: Promise<\{ id: string \}>; searchParams: Promise<[^>]+> \}\)/g,
    "export default function $1()",
  );
  view = view.replace(
    /export default async function (\w+)\(\{ params, searchParams \}: \{ params: Promise<\{ threadId: string \}>; searchParams: Promise<[^>]+> \}\)/g,
    "export default function $1()",
  );

  view = view.replace(/const sp = await searchParams;/g, "const sp = Object.fromEntries(useSearchParams().entries());");
  view = view.replace(/const f = await searchParams;/g, "const f = Object.fromEntries(useSearchParams().entries());");
  view = view.replace(/sp=\{await searchParams\}/g, "sp={Object.fromEntries(useSearchParams().entries())}");
  view = view.replace(/const \{ id \} = await params;/g, "const { id } = useParams() as { id: string };");
  view = view.replace(/const \{ threadId \} = await params;/g, "const { threadId } = useParams() as { threadId: string };");

  view = view.replace(/import \{ currentRole \} from "@\/lib\/role"/g, 'import { demoRole } from "@/lib/role"');
  view = view.replace(/await currentRole\(\)/g, "demoRole()");

  fs.writeFileSync(viewPath, view);

  const wrapper = `import { Suspense } from "react";
import PageView from "./page-view";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";

${meta}${gmeta}
export default function Page() {
  return (
    <Suspense fallback={<StaticPageFallback><p className="muted">Loading…</p></StaticPageFallback>}>
      <PageView />
    </Suspense>
  );
}
`;
  fs.writeFileSync(pagePath, wrapper);
  console.log("converted", relFromRepo);
}
