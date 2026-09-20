import { publicOpenApi } from "../../../api/src/public/openapi.js";

export function handleOpenapiPublicDump(): Record<string, unknown> {
  return {
    openapi: publicOpenApi,
    pathCount: Object.keys(publicOpenApi.paths).length,
  };
}
