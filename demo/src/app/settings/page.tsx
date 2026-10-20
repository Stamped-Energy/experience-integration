import { AreaStub } from "@/components/stub/AreaStub";
export const metadata = { title: "Settings" };
export default function Page() {
  return <AreaStub area="Settings" title="Settings" intro="Limits, approvals, people and roles, routing and integrations, set per plant beforehand." screens={[
    { name: "Signed limits", what: "Windows per line and parameter, signer, version, expiry, narrowing", template: "T4 settings" },
    { name: "Standing approvals", what: "Bands that need no per-run decision, with uses and review date", template: "T4 settings" },
    { name: "People and roles", what: "RBAC matrix: role × action × scope", template: "T4 settings" },
    { name: "Routing and notifications", what: "Primary and backup per scope, from the assignments matrix", template: "T4 settings" },
    { name: "Integrations", what: "Historian, production and lab systems, API keys, webhooks, sign-in", template: "T4 settings" },
    { name: "Plant setup and prices", what: "Units, shifts, languages and the plant's own prices", template: "T4 settings" },
  ]} />;
}
