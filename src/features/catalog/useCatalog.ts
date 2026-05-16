import { useEffect, useMemo, useState } from "react";
import { fourChanService } from "@/features/chan/fourChanService";
import { cleanFourChanComment } from "@/lib/4chan/html";
import type { FourChanCatalogPage, FourChanPost } from "@/lib/4chan/types";

export type ThreadSummary = FourChanPost & {
  title: string;
  preview: string;
};

function getThreadTitle(thread: FourChanPost) {
  if (thread.sub) return cleanFourChanComment(thread.sub);
  const preview = cleanFourChanComment(thread.com);
  return preview || `Thread #${thread.no}`;
}

export function useCatalog(board?: string) {
  const [pages, setPages] = useState<FourChanCatalogPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!board) {
      setPages([]);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fourChanService
      .catalog(board, controller.signal)
      .then(setPages)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Could not load catalog");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [board]);

  const threads = useMemo<ThreadSummary[]>(() => {
    return pages.flatMap((page) =>
      page.threads.map((thread) => ({
        ...thread,
        title: getThreadTitle(thread),
        preview: cleanFourChanComment(thread.com),
      })),
    );
  }, [pages]);

  return { threads, isLoading, error };
}
