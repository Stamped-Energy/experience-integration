import Link from "next/link";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { can, grant, whoCan, ACTIONS, ACTION_LABELS, ROLE_ORDER } from "@/lib/rbac";
import { dayMonth, rel } from "@/lib/format";
import { deniedReason } from "@/components/cards/DecisionCard";
import { LimitsBand } from "@/components/ui/LimitsBand";
import { DataTable, LineModeTag, ModeTag, Section, Tag } from "@/components/ui/primitives";
import { ConfirmAction } from "@/components/settings/Confirm";
import { GrantTag, SettingsPage, roleName } from "@/components/settings/common";


export const metadata = { title: "Signed limits" };
export default async function Limits() {
  const role = await currentRole();
  const sign = can(role, "sign-limits"), narrow = can(role, "narrow-limit");
  return (
    <SettingsPage section="limits" title="Signed limits" meta="Windows Stamped works inside, signed per line beforehand. Stamped may narrow a window, never widen it; Stamped staff can never sign."
      changes={["sign-limits", "narrow-limit"]} audit={/Narrowed|Signed/}
      help={<ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}><li>Signer is set per plant; plant head by default.</li><li>Narrowing is hatched inside the signed band.</li><li>Each signature creates a new version and a manifest entry.</li><li>Expired windows stop all writes on that parameter.</li></ul>}>
      {D.lines.map((l) => (
        <Section key={l.id} title={l.name} meta={`${D.signedWindows.filter((w) => w.lineId === l.id).length} windows · signer ${roleName(D.signedWindows.find((w) => w.lineId === l.id)!.signerRole)}`} actions={<LineModeTag mode={l.mode} />} flush>
          <DataTable caption={`Limits, ${l.name}`} rowKey={(w) => w.id} rows={D.signedWindows.filter((w) => w.lineId === l.id)} columns={[
            { key: "n", label: "Parameter", render: (w) => <>{w.name}<span className="cell-sub mono">{w.manifestRef}</span></> },
            { key: "b", label: "Signed band and narrowing", width: "34%", render: (w) => { const cur = D.runningSettings.find((r) => r.lineId === w.lineId && r.param === w.param); return <LimitsBand name={w.name} unit={w.unit} signed={[w.low, w.high]} narrowed={w.narrowedLow !== undefined ? [w.narrowedLow, w.narrowedHigh!] : undefined} current={cur?.value ?? (w.low + w.high) / 2} signedBy={w.signedBy} signedAt={dayMonth(w.signedAt)} legend={false} />; } },
            { key: "w", label: "Window", align: "right", render: (w) => <>{w.low} to {w.high} {w.unit}{w.narrowedLow !== undefined ? <span className="cell-sub">narrowed {w.narrowedLow} to {w.narrowedHigh} by {w.narrowedBy}</span> : null}</> },
            { key: "s", label: "Signed", render: (w) => <>{w.signedBy}<span className="cell-sub">{dayMonth(w.signedAt)} · v{w.version}</span></> },
            { key: "e", label: "Expires", render: (w) => <>{dayMonth(w.expiresAt)}<span className="cell-sub">{rel(w.expiresAt)}</span></> },
            { key: "a", label: "", render: (w) => <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <ConfirmAction label="Narrow" allowed={narrow} reason={deniedReason("narrow-limit", "narrow")} title={`Narrow ${w.name.toLowerCase()} on ${l.short}`} body={<p>Narrowing tightens the window Stamped works inside. It never widens the signed band of {w.low} to {w.high} {w.unit}.</p>} confirm="Narrow" done="Narrowed (illustrative)." />
              <ConfirmAction label="Sign" allowed={sign} reason={deniedReason("sign-limits", "sign")} title={`Sign version ${w.version + 1}`} body={<><p>You are signing {w.name.toLowerCase()} on {l.name}, {w.low} to {w.high} {w.unit}.</p><blockquote>Stamped works inside limits set beforehand. This signature sets those limits until {dayMonth(w.expiresAt)}.</blockquote></>} confirm="Sign window" done="Signed (illustrative)." />
            </div> },
          ]} />
        </Section>
      ))}
      <Section title="Running settings against these windows" flush>
        <DataTable caption="Running settings" rowKey={(r) => r.lineId + r.param} rows={D.runningSettings} columns={[
          { key: "l", label: "Line", render: (r) => D.byId.line(r.lineId)!.short },
          { key: "n", label: "Setting", render: (r) => r.name },
          { key: "v", label: "Value", align: "right", render: (r) => `${r.value} ${r.unit}` },
          { key: "m", label: "Mode", render: (r) => <ModeTag mode={r.mode} /> },
          { key: "s", label: "Written by", render: (r) => roleName(r.signerRole) },
          { key: "e", label: "Until", render: (r) => dayMonth(r.expiresAt) },
        ]} />
      </Section>
    </SettingsPage>
  );
}
