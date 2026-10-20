import { AreaStub } from "@/components/stub/AreaStub";
export const metadata = { title: "Ask" };
export default function Page() {
  return <AreaStub area="Ask" title="Ask" intro="Questions answered with an evidence id and label on every claim. Ask reads only and can say it does not know." screens={[
    { name: "Conversation", what: "History, suggested questions, claims with evidence ids, cards from an allow-list", template: "T1 feed" },
    { name: "Saved answers", what: "Answers kept by people for later", template: "T3 table" },
    { name: "Handover and weekly note", what: "Shift handover and the weekly note, every claim cited", template: "T1 feed" },
  ]} />;
}
