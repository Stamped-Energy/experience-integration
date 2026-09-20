import {
  PermissionSchema,
  matrixEntries,
} from "../../../api/src/authz/index.js";

export function handleAuthzMatrix(): Record<string, unknown> {
  const entries = matrixEntries();
  return {
    permissions: [...PermissionSchema],
    entries,
    roleCount: new Set(entries.map((e) => e.role)).size,
    permissionCount: PermissionSchema.length,
  };
}
