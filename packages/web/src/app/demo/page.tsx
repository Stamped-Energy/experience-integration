"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { enableDemoSession } from "@/lib/demo-session";

export default function DemoLaunchPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  useEffect(() => {
    enableDemoSession();
    void refresh().then(() => router.replace("/"));
  }, [refresh, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--forge-background)",
        color: "var(--forge-on-surface)",
        fontFamily: "var(--forge-font-body)",
      }}
    >
      Opening Jaipur Works…
    </main>
  );
}
