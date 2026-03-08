import { sseBroker } from "@/lib/sse-broker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  const body = await req.json().catch(() => null);
  const userId = body?.userId;
  const isTyping = body?.isTyping;

  if (typeof userId !== "string" || typeof isTyping !== "boolean") {
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }

  sseBroker.broadcast(
    roomId,
    "typing",
    {
      userId,
      isTyping,
      ts: Date.now(),
    },
    userId
  );

  return Response.json({ ok: true });
}
