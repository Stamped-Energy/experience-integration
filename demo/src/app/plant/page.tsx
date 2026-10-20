import { AreaStub } from "@/components/stub/AreaStub";
export const metadata = { title: "Plant" };
export default function Page() {
  return <AreaStub area="Plant" title="Plant" intro="The plant as Stamped sees it: sections, assets, data health and the Plant Box." screens={[
    { name: "Plant map", what: "Sections with key readings and Explore", template: "Control-room view" },
    { name: "Asset detail", what: "Tags, readings and recent cards for one asset", template: "T2 investigation" },
    { name: "Data health", what: "Sources, gaps and quality codes", template: "T3 table" },
    { name: "Plant Box and lease", what: "Offline lease: at most 4 h, never more than 8; revocable on site", template: "T4 settings" },
    { name: "Line packs", what: "Run definition, series, setpoints, model, constraints", template: "T3 table" },
  ]} />;
}
