import Link from "next/link";
import { notFound } from "next/navigation";
import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader, Tag } from "@/components/ui/primitives";
import { ExportAsMenu } from "@/components/view/export-as";
import { ReportReader } from "@/components/view/report-reader";
import { PLANT_REPORTS, reportById } from "@/lib/demo/plantReport";
import { crumbs, processEyebrow } from "@/components/process/common";

export function generateStaticParams() {
  return PLANT_REPORTS.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = reportById(id);
  return { title: report?.name ?? "Report" };
}

export default async function ProcessReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = reportById(id);
  if (!report) notFound();

  return (
    <Workspace
      crumbs={crumbs({ label: "Reports", href: "/process/reports" }, { label: report.name })}
      askContext={report.name}
    >
      <PageHeader
        eyebrow={processEyebrow(`/process/reports/${report.id}`)}
        title={report.name}
        meta={
          <span>
            {report.kind} · {report.periodLabel} · {report.lineLabel}{" "}
            {report.status === "ready" ? (
              <Tag tone="success" dot>
                Ready
              </Tag>
            ) : (
              <Tag tone="warning" dot>
                Draft
              </Tag>
            )}
          </span>
        }
        actions={
          <>
            <Link className="btn btn-sm btn-quiet" href="/process/reports">
              All reports
            </Link>
            <ExportAsMenu
              reportName={report.name}
              formats={report.formats}
              ready={report.status === "ready"}
              blockedReason="Draft until the process engineer signs"
              primary
            />
            <AskButton context={report.name} label="Ask about this report" />
          </>
        }
      />
      <ProcessHubTabs />
      <p className="pfd-demo-banner">Demonstration data only. {report.summary}</p>
      <ReportReader report={report} />
    </Workspace>
  );
}
