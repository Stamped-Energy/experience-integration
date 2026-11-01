"use client";

"use client";

import { ScreenTogglePanel } from "@/components/settings/ScreenToggleAdmin";
import { SettingsPage } from "@/components/settings/common";

export default function SettingsScreensClient() {
  return (
    <SettingsPage
      section="screens"
      title="Screen toggles"
      meta="Per-site Process and Quality screen flags for the demonstration UI."
      changes={[]}
      audit={/never-match-screens-demo/}
      help={
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
          Defaults live in <code>demo/src/config/screens.json</code>. Overrides persist in localStorage for this browser only.
        </p>
      }
    >
      <ScreenTogglePanel />
    </SettingsPage>
  );
}
