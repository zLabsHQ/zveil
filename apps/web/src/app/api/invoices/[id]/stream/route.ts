import { bus, type InvoiceEventPayload } from "@/lib/bus";
import { db } from "@/lib/db";
import { invoices } from "@zveil/db";
import { eq } from "drizzle-orm";


type Ctx = { params: Promise<{ id: string }> };

// SSE stream for live invoice status. Subscribe by invoice id or public slug.
export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const bySlug = new URL(req.url).searchParams.get("by") === "slug";
  const inv = bySlug
    ? db().select().from(invoices).where(eq(invoices.slug, id)).get()
    : db().select().from(invoices).where(eq(invoices.id, id)).get();
  if (!inv) return new Response("not found", { status: 404 });

  const channel = bySlug ? `slug:${id}` : `invoice:${id}`;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (p: InvoiceEventPayload) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(p)}\n\n`));
      };
      const ping = setInterval(() => controller.enqueue(encoder.encode(`: ping\n\n`)), 20_000);
      bus().on(channel, send);
      // push current state immediately so late subscribers are in sync
      send({ invoiceId: inv.id, type: "status", status: inv.status });
      req.signal.addEventListener("abort", () => {
        clearInterval(ping);
        bus().off(channel, send);
        controller.close();
      });
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
