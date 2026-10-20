import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/shell/Shell";
import { DISPLAY_SCRIPT } from "@/components/shell/ShellClient";
import "@/styles/tokens.css";
import "@/styles/app.css";
import "@/styles/process.css";
import "@/styles/quality.css";
import "@/styles/plant.css";
import "@/styles/ask.css";
import "@/styles/settings.css";
import "@/styles/activity.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
/** Brand face, one or two places only (spec Revision 4). */
const brand = Space_Grotesk({ subsets: ["latin"], weight: ["500"], variable: "--font-brand", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Stamped · Demonstration plant", template: "%s · Stamped" },
  description: "Stamped on a fictional demonstration plant with illustrative data. Stamped works inside limits set beforehand.",
};
export const viewport: Viewport = { themeColor: "#FAFAF9", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" data-theme="light" className={`${geist.variable} ${geistMono.variable} ${brand.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: DISPLAY_SCRIPT }} /></head>
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
