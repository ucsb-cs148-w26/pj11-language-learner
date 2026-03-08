
import { sseBroker } from "@/lib/sse-broker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatSse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return new Response("missing userId", { status: 400 });
  }

  const clientId = crypto.randomUUID();

  let heartbeat: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(formatSse(event, data)));
      };

      const close = () => {
        try {
          controller.close();
        } catch {}
      };

      sseBroker.addClient(roomId, {
        id: clientId,
        userId,
        send,
        close,
      });

      send("connected", { ok: true, clientId });

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: keep-alive\n\n`));
      }, 15000);
    },

    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      sseBroker.removeClient(roomId, clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
