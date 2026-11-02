"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { DemoReportFormat } from "@/lib/demo/plantReport";
import { demoRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { deniedReason } from "@/components/cards/DecisionCard";

export function ExportAsMenu({
  reportName,
  formats,
  ready = true,
  blockedReason,
  primary,
}: {
  reportName: string;
  formats: DemoReportFormat[];
  ready?: boolean;
  blockedReason?: string;
  primary?: boolean;
}) {
  const role = demoRole();
  const allowed = can(role, "export-reports");
  const rbacReason = deniedReason("export-reports", "export reports");
  const notReadyReason = blockedReason ?? "Needs approval before export";
  const disabled = !allowed || !ready;
  const reason = !allowed ? rbacReason : !ready ? notReadyReason : undefined;

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<DemoReportFormat | null>(null);
  const [done, setDone] = useState<DemoReportFormat | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (pending) dialog.current?.showModal();
  }, [pending]);

  if (done) {
    return (
      <span className="set-done" role="status">
        Exported as {done}.{" "}
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setDone(null)}>
          Undo
        </button>
      </span>
    );
  }

  return (
    <div className={`export-as${open ? " open" : ""}`} ref={root}>
      <button
        type="button"
        className={`btn btn-sm${primary ? " btn-primary" : ""}`}
        disabled={disabled}
        title={reason}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        Export as
        <span className="export-as-caret" aria-hidden>
          ▾
        </span>
      </button>
      {open && !disabled ? (
        <ul id={menuId} className="export-as-menu" role="menu" aria-label={`Export ${reportName}`}>
          {formats.map((format) => (
            <li key={format} role="none">
              <button
                type="button"
                role="menuitem"
                className="export-as-item"
                onClick={() => {
                  setOpen(false);
                  setPending(format);
                }}
              >
                {format}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <dialog
        ref={dialog}
        className="confirm"
        aria-label={pending ? `Export ${reportName} as ${pending}` : "Export report"}
        onClose={() => setPending(null)}
      >
        <h2>{pending ? `Export as ${pending}` : "Export"}</h2>
        <div className="confirm-body">
          <p>
            {reportName}. Evidence labels stay on every figure. Demonstration export only; nothing leaves the plant.
          </p>
        </div>
        <p className="muted">nothing is changed until you confirm.</p>
        <div className="confirm-actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              dialog.current?.close();
              setPending(null);
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => {
              const format = pending;
              dialog.current?.close();
              setPending(null);
              if (format) setDone(format);
            }}
          >
            Export
          </button>
        </div>
      </dialog>
    </div>
  );
}
