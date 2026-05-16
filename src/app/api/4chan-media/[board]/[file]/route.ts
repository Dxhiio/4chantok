import { NextResponse, type NextRequest } from "next/server";

const VALID_BOARD = /^[a-z0-9]+$/i;
const VALID_FILE = /^\d+(s\.jpg|\.(jpg|jpeg|png|gif|webm))$/i;

type RouteContext = {
  params: {
    board: string;
    file: string;
  };
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function copyHeader(source: Headers, target: Headers, name: string) {
  const value = source.get(name);
  if (value) target.set(name, value);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { board, file } = context.params;

  if (!VALID_BOARD.test(board) || !VALID_FILE.test(file)) {
    return NextResponse.json({ error: "Invalid media path" }, { status: 400 });
  }

  const upstreamUrl = `https://i.4cdn.org/${board}/${file}`;
  const range = request.headers.get("range");
  const upstream = await fetch(upstreamUrl, {
    cache: "no-store",
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,video/webm,*/*;q=0.8",
      ...(range ? { Range: range } : {}),
      "User-Agent": "4chantok/0.1 (+local development media proxy)",
    },
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: `4chan media responded ${upstream.status}` }, { status: upstream.status });
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, private",
    "Clear-Site-Data": '"cache"',
    Expires: "0",
    Pragma: "no-cache",
    "Accept-Ranges": upstream.headers.get("Accept-Ranges") ?? "bytes",
    "X-Content-Type-Options": "nosniff",
    Vary: "Range",
  });

  copyHeader(upstream.headers, headers, "Content-Length");
  copyHeader(upstream.headers, headers, "Content-Range");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
