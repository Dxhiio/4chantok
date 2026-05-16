import { NextResponse, type NextRequest } from "next/server";
import { upstreamFourChanJson } from "@/server/fourChanProxy";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    path?: string[];
  };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const path = context.params.path ?? [];
    const payload = await upstreamFourChanJson(path);

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=15, stale-while-revalidate=45",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown proxy error";
    const status = message.startsWith("Invalid") ? 400 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
