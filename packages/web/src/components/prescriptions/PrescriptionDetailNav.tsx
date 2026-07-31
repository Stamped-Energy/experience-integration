"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
import { ForgeButton, ForgeButtonGroup } from "@/components/ui/primitives";
import "./prescription-detail-nav.css";

export function PrescriptionDetailNav({
  prevHref,
  nextHref,
  label,
  backHref = "/prescriptions",
}: {
  prevHref: string | null;
  nextHref: string | null;
  label: string;
  backHref?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft" && prevHref) {
        e.preventDefault();
        router.push(prevHref);
      }
      if (e.key === "ArrowRight" && nextHref) {
        e.preventDefault();
        router.push(nextHref);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prevHref, nextHref]);

  return (
    <ForgeButtonGroup aria-label="Prescription navigation" toolbar>
      <ForgeButton variant="link" href={backHref}>
        Back to queue
      </ForgeButton>
      <ForgeButton
        variant="ghost"
        icon={<ChevronLeft size={16} />}
        href={prevHref ?? undefined}
        disabled={!prevHref}
        aria-label="Previous prescription"
      >
        Prev
      </ForgeButton>
      <span className="rx-detail-nav__pos tabular" aria-live="polite">
        {label}
      </span>
      <ForgeButton
        variant="ghost"
        icon={<ChevronRight size={16} />}
        href={nextHref ?? undefined}
        disabled={!nextHref}
        aria-label="Next prescription"
      >
        Next
      </ForgeButton>
    </ForgeButtonGroup>
  );
}
