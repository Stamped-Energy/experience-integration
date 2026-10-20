import { AreaStub } from "@/components/stub/AreaStub";
export const metadata = { title: "Quality" };
export default function Page() {
  return <AreaStub area="Quality" title="Quality" intro="Whether each lot will meet spec, how sure we are, and corrections sent to Process. Release happens in the plant's quality system." screens={[
    { name: "Lots at risk", what: "Lots with predicted property band against spec", template: "T3 table" },
    { name: "Lot detail and join", what: "Link scores, labels, property band, anchored or not; evidence on demand", template: "T2 investigation" },
    { name: "Drift", what: "Drift signals with the alarm budget", template: "T3 table" },
    { name: "Investigations", what: "Entries with evidence ids and labels", template: "T2 investigation" },
    { name: "Link confirmations", what: "Links below the pack threshold, as tasks", template: "T3 table" },
    { name: "Specs and grades", what: "Limits from the plant's documents, versioned", template: "T4 settings" },
    { name: "Corrections to Process", what: "Sent, accepted or declined, with the estimate behind each", template: "T3 table" },
  ]} />;
}
