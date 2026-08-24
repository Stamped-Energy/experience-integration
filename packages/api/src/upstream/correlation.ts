/** Correlation id propagation for outbound upstream calls. */

import { AsyncLocalStorage } from "node:async_hooks";

export type CorrelationContext = {
  requestId: string;
};

export const correlationStore = new AsyncLocalStorage<CorrelationContext>();

export function currentRequestId(): string | undefined {
  return correlationStore.getStore()?.requestId;
}
