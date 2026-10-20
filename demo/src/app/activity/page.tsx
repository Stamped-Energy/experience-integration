import { AreaStub } from "@/components/stub/AreaStub";
export const metadata = { title: "Activity" };
export default function Page() {
  return <AreaStub area="Activity" title="Activity" intro="Who approved, overrode or stopped what, and the reports that leave the plant." screens={[
    { name: "Audit log", what: "Every decision, write, stop and signature with before and after", template: "T3 table" },
    { name: "Reports and exports", what: "Approval queue and CSV, HTML and DOCX exports", template: "T3 table" },
  ]} />;
}
