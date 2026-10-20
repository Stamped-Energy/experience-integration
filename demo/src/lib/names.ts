/** Plain names for demo objects, so user-visible text never shows an internal id. Ids stay in URLs and code. */
import * as D from "@/lib/demo/data";

const tail = (id: string) => id.split("-").pop()!;
const settingName = (lineId: string, param: string) => D.runningSettings.find((s) => s.lineId === lineId && s.param === param)?.name ?? D.signedWindows.find((w) => w.lineId === lineId && w.param === param)?.name ?? param.replace(/-/g, " ");
const unitOf = (lineId: string, param: string) => D.runningSettings.find((s) => s.lineId === lineId && s.param === param)?.unit ?? D.signedWindows.find((w) => w.lineId === lineId && w.param === param)?.unit ?? "";
const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export const runName = (id: string) => { const r = D.runs.find((x) => x.id === id); return r ? (r.lineId === "line-a" ? `Batch ${tail(id)}` : `Shift run ${tail(id)}`) : id.startsWith("run-a") ? `Batch ${tail(id)}` : `Shift run ${tail(id)}`; };
export const lotName = (id: string) => `Lot ${tail(id)}`;
/** "Agitator speed 150 to 158 rpm" */
export const proposalName = (id: string) => { const p = D.byId.proposal(id); return p ? `${settingName(p.lineId, p.param)} ${p.current} to ${p.proposed} ${unitOf(p.lineId, p.param)}`.trim() : "Proposal"; };
/** "the agitator speed change" */
export const proposalShort = (id: string) => { const p = D.byId.proposal(id); return p ? `the ${lc(settingName(p.lineId, p.param))} change` : "this change"; };
export const settingLabel = (lineId: string, param: string) => settingName(lineId, param);
export const trialName = (id: string) => { const t = D.byId.trial(id); return t ? `${t.change.split(/ \d/)[0]} trial, ${D.byId.line(t.lineId)?.short}` : "Trial"; };

export function nameOf(id?: string): string {
  if (!id) return "";
  if (id.startsWith("prop-")) return proposalName(id);
  if (id.startsWith("lot-")) return lotName(id);
  if (id.startsWith("run-")) return runName(id);
  if (id.startsWith("trial-")) return trialName(id);
  if (id.startsWith("proof-")) return D.byId.proof(id)?.title ?? "Proof record";
  if (id.startsWith("corr-")) { const c = D.byId.correction(id); return c ? `${c.direction === "raise" ? "Raise" : "Lower"} ${lc(settingName(c.toLineId, c.param))} for lot ${tail(c.lotId)}` : "Correction"; }
  if (id.startsWith("win-")) { const w = D.signedWindows.find((x) => x.id === id); return w ? `${w.name} window, ${D.byId.line(w.lineId)?.short}` : "Signed window"; }
  if (id.startsWith("sa-ans-")) return D.savedAnswers.find((s) => s.id === id)?.title ?? "Saved answer";
  if (id.startsWith("sa-")) { const a = D.standingApprovals.find((x) => x.id === id); return a ? `${a.params.map((p) => settingName(a.lineId, p)).join(", ")} approval, ${D.byId.line(a.lineId)?.short}` : "Standing approval"; }
  if (id.startsWith("rep-")) { const r = D.reports.find((x) => x.id === id); return r ? `${r.kind}, ${r.period}` : "Report"; }
  if (id.startsWith("note-")) return D.notes.find((n) => n.id === id)?.title ?? "Note";
  if (id.startsWith("ask-")) return D.askThreads.find((t) => t.id === id)?.title ?? "Conversation";
  if (id.startsWith("inv-")) return D.investigations.find((i) => i.id === id)?.title ?? "Investigation";
  if (id.startsWith("drift-")) { const d = D.driftSignals.find((x) => x.id === id); return d ? `${d.property} drift, ${D.byId.line(d.lineId)?.short}` : "Drift"; }
  if (id.startsWith("lease-")) { const l = D.leases.find((x) => x.id === id); return l ? `Lease issued ${l.issuedAt.slice(8, 10)}/${l.issuedAt.slice(5, 7)} ${l.issuedAt.slice(11, 16)}` : "Lease"; }
  if (id.startsWith("mp-")) { const m = D.measurementPlans.find((x) => x.id === id); return m ? `Measurement plan for the ${lc(trialName(m.trialId))}` : "Measurement plan"; }
  if (id.startsWith("gap-")) { const g = D.dataGaps.find((x) => x.id === id); return g ? g.affects : "Data gap"; }
  if (id.startsWith("in-")) return D.inboxItems.find((x) => x.id === id)?.title ?? "Inbox item";
  if (id.startsWith("link-")) { const l = D.lotLinks.find((x) => x.id === id); return l ? `Lot ${tail(l.lotId)} to ${lc(runName(l.runId))}` : "Lot link"; }
  if (id.startsWith("lab-")) { const l = D.labResults.find((x) => x.id === id); return l ? `Lab result, lot ${tail(l.lotId)}` : "Lab result"; }
  if (id.startsWith("model-")) return `Line model ${id.replace("model-", "").toUpperCase()}`;
  if (id.startsWith("box-")) return "Plant Box";
  if (id.startsWith("wh-")) { const w = D.webhooks.find((x) => x.id === id); return w ? new URL(w.url).hostname : "Webhook"; }
  if (id.startsWith("key-")) return D.apiKeys.find((x) => x.id === id)?.label ?? "API key";
  if (id.startsWith("aud-")) { const a = D.auditEvents.find((x) => x.id === id); return a ? a.action : "Audit event"; }
  if (id.startsWith("val-")) return D.valueItems.find((x) => x.id === id)?.title ?? "Value item";
  return id;
}
