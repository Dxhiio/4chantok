import type { BoardsResponse, FourChanCatalogPage, FourChanThreadResponse } from "@/lib/4chan/types";

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/4chan/${path}`, { signal });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const fourChanService = {
  boards(signal?: AbortSignal) {
    return getJson<BoardsResponse>("boards", signal);
  },

  catalog(board: string, signal?: AbortSignal) {
    return getJson<FourChanCatalogPage[]>(`${board}/catalog`, signal);
  },

  thread(board: string, threadNo: number, signal?: AbortSignal) {
    return getJson<FourChanThreadResponse>(`${board}/thread/${threadNo}`, signal);
  },
};
