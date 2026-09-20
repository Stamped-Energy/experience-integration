import {
  clearUpstreamProbeCache,
  probeUpstreams,
} from "../../../api/src/meta/upstreams.js";
import { orgIdForExternalPlantId } from "../../../api/src/upstream/mappings.js";

export type UpstreamsProbeFlags = {
  plantId?: string;
  orgId?: string;
};

function fixtureMode(): boolean {
  const v = process.env.USE_FIXTURES;
  return v === "true" || v === "1";
}

export async function handleUpstreamsProbe(
  flags: UpstreamsProbeFlags,
): Promise<Record<string, unknown>> {
  clearUpstreamProbeCache();

  const plantId =
    flags.plantId?.trim() ||
    process.env.STAMPED_DEFAULT_PLANT_ID?.trim() ||
    "plant_jaipur_01";
  const orgId =
    flags.orgId?.trim() || orgIdForExternalPlantId(plantId);

  const useFixtures = fixtureMode();
  const l2Live = !useFixtures && process.env.L2_LIVE !== "false";
  const l5Live =
    !useFixtures &&
    process.env.L5_LIVE !== "false" &&
    process.env.L6_L5_LIVE !== "false";
  const l4Live = !useFixtures && process.env.L4_LIVE === "true";

  const probe = await probeUpstreams(
    {
      createL2Client: undefined,
      l5: null,
      l4: null,
      l2Live,
      l5Live,
      l4Live,
    },
    { orgId, plantId },
  );

  return { probe, liveGates: { l2Live, l5Live, l4Live, useFixtures } };
}
