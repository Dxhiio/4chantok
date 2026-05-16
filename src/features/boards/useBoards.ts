import { useEffect, useMemo, useState } from "react";
import { fourChanService } from "@/features/chan/fourChanService";
import type { FourChanBoard } from "@/lib/4chan/types";

export function useBoards(query: string) {
  const [boards, setBoards] = useState<FourChanBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    fourChanService
      .boards(controller.signal)
      .then((payload) => setBoards(payload.boards))
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Could not load boards");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const filteredBoards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return boards;

    return boards.filter((board) => {
      return board.board.includes(normalizedQuery) || board.title.toLowerCase().includes(normalizedQuery);
    });
  }, [boards, query]);

  return { boards: filteredBoards, isLoading, error };
}
