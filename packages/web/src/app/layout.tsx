import type { Metadata } from "next";
import { PlantProvider } from "@/lib/plant-context";
import { DataSourceProvider } from "@/lib/data-source-context";
import { StaffUnlockGuard } from "@/components/settings/StaffUnlockGuard";
import "@/styles/tokens.css";
import "@/styles/forge-ui.css";
import "@/components/shell/shell.css";
import "@/components/evidence/evidence.css";
import "@/components/analyst/contextual-analyst.css";
import "@/components/analytics/sustainability.css";
import "@/components/alarms/alarm-full-case.css";
import "@/components/prescriptions/prescription-full-case.css";

export const metadata: Metadata = {
  title: "Stamped Energy",
  description: "Energy operations dashboard for your plant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PlantProvider>
          <DataSourceProvider>
            <StaffUnlockGuard>{children}</StaffUnlockGuard>
          </DataSourceProvider>
        </PlantProvider>
      </body>
    </html>
  );
}
