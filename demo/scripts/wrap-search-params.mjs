#!/usr/bin/env node
/**
 * Wraps app pages that use `searchParams` so the route can be statically generated.
 * Moves the page module to *.content.tsx and leaves a thin static page.tsx with Suspense.
 */
import fs from "node:fs";
import path from "node:path";

const appDir = path.join(process.cwd(), "src/app");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name === "page.tsx") out.push(p);
  }
  return out;
}

for (const pagePath of walk(appDir)) {
  const src = fs.readFileSync(pagePath, "utf8");
  if (!src.includes("searchParams")) continue;
  const dir = path.dirname(pagePath);
  const contentPath = path.join(dir, "page.content.tsx");
  if (fs.existsSync(contentPath)) continue;

  let body = src;
  if (!body.startsWith('"use client"')) {
    body = `"use client";\n${body}`;
  }
  body = body.replace(
    /export default async function (\w+)\(\{[^}]*searchParams[^}]*\}\)/g,
    "export default function $1()",
  );
  body = body.replace(
    /export default async function (\w+)\(\{ params, searchParams \}[^)]*\)/g,
    "export default function $1({ params }: { params: { id: string } })",
  );
  body = body.replace(/const sp = await searchParams;/g, "const sp = Object.fromEntries(new URLSearchParams(typeof window !== \"undefined\" ? window.location.search : \"\"));");
  body = body.replace(/const f = await searchParams;/g, "const f = Object.fromEntries(new URLSearchParams(typeof window !== \"undefined\" ? window.location.search : \"\"));");
  body = body.replace(/await searchParams/g, "new URLSearchParams(typeof window !== \"undefined\" ? window.location.search : \"\")");

  fs.writeFileSync(contentPath, body);

  const base = path.basename(dir);
  const importName = base.replace(/[^a-zA-Z0-9]/g, "") || "Page";
  const wrapper = `import { Suspense } from "react";
import ${importName}Content from "./page.content";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";

export { metadata, generateMetadata, generateStaticParams } from "./page.content";

export default function Page(props: Record<string, unknown>) {
  return (
    <Suspense fallback={<StaticPageFallback><p className="muted">Loading…</p></StaticPageFallback>}>
      <${importName}Content {...props} />
    </Suspense>
  );
}
`;
  fs.writeFileSync(pagePath, wrapper);
  console.log("wrapped", pagePath);
}
