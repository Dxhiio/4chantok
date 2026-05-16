import { fourChanRateLimiter } from "./rateLimiter";

const API_BASE_URL = "https://a.4cdn.org";
const VALID_BOARD = /^[a-z0-9]+$/i;
const VALID_THREAD_NO = /^\d+$/;

function toUpstreamUrl(path: string[]) {
  if (path.length === 1 && path[0] === "boards") {
    return `${API_BASE_URL}/boards.json`;
  }

  if (path.length === 2 && VALID_BOARD.test(path[0]) && path[1] === "catalog") {
    return `${API_BASE_URL}/${path[0]}/catalog.json`;
  }

  if (
    path.length === 3 &&
    VALID_BOARD.test(path[0]) &&
    path[1] === "thread" &&
    VALID_THREAD_NO.test(path[2])
  ) {
    return `${API_BASE_URL}/${path[0]}/thread/${path[2]}.json`;
  }

  throw new Error("Invalid 4chan proxy path");
}

export async function upstreamFourChanJson(path: string[]) {
  const upstreamUrl = toUpstreamUrl(path);

  return fourChanRateLimiter.enqueue(async () => {
    const response = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "4chantok/0.1 (+local development proxy)",
      },
      next: { revalidate: 15 },
    });

    if (!response.ok) {
      throw new Error(`4chan upstream responded ${response.status}`);
    }

    return response.json();
  });
}
