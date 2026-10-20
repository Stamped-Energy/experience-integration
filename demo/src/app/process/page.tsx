import { AreaStub } from "@/components/stub/AreaStub";
export const metadata = { title: "Process" };
export default function Page() {
  return <AreaStub area="Process" title="Process" intro="Per-run proposals inside the signed window, trials, and evidence on demand for runs and lines." screens={[
    { name: "Lines", what: "Each line with mode, running settings and last runs", template: "T3 table" },
    { name: "Line detail, runs, run detail", what: "Runs with setpoints and outcomes; evidence on demand: four questions, verdict, rung", template: "T2 investigation" },
    { name: "Proposals, proposal and test", what: "Optimiser number, reason, predicted band, signed band, safety filter, fit card", template: "T2 investigation" },
    { name: "Trials and stops", what: "Restore target, switchback schedule, skipped switches, Stop", template: "T3 table" },
    { name: "Measurement plans and holding check", what: "Locked, hashed plans; holding, faded or inconclusive", template: "T3 table" },
    { name: "Running settings", what: "Every value written, mode, signer, expiry", template: "T3 table" },
    { name: "Model fit", what: "Four checks, interval coverage, held-out points", template: "T2 investigation" },
  ]} />;
}
