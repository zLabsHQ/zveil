import { EventEmitter } from "node:events";

export type InvoiceEventPayload = {
  invoiceId: string;
  slug?: string;
  type: "status" | "payment" | "reorg";
  status?: string;
  payment?: unknown;
};

declare global {
  var __zveilBus: EventEmitter | undefined;
}

export function bus(): EventEmitter {
  if (!globalThis.__zveilBus) {
    globalThis.__zveilBus = new EventEmitter();
    globalThis.__zveilBus.setMaxListeners(100);
  }
  return globalThis.__zveilBus;
}

export function emitInvoice(p: InvoiceEventPayload) {
  bus().emit(`invoice:${p.invoiceId}`, p);
  if (p.slug) bus().emit(`slug:${p.slug}`, p);
}
