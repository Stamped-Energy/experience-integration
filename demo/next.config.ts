import type { NextConfig } from "next";

/** Old energy showcase routes (spec §13) redirect to their new homes. */
const OLD: [string, string][] = [
  ["/overview", "/"], ["/demo", "/"], ["/login", "/"], ["/tools", "/"], ["/energy", "/?view=owner"], ["/intensity", "/?view=owner"],
  ["/alarms", "/inbox"], ["/alarms/:id", "/inbox"], ["/prescriptions", "/inbox"], ["/prescriptions/:id", "/inbox"],
  ["/evidence", "/process"], ["/evidence/:id", "/process"], ["/analyst", "/ask"], ["/equipment", "/plant"], ["/live", "/plant"],
  ["/plant-map", "/plant"], ["/reports", "/activity"], ["/settings/admin", "/settings"], ["/settings/assignments", "/settings"],
  ["/settings/integrations", "/settings"],
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return OLD.map(([source, destination]) => ({ source, destination, permanent: false }));
  },
};

export default nextConfig;
