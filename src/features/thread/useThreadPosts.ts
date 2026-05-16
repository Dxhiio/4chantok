import { useEffect, useState } from "react";
import { fourChanService } from "@/features/chan/fourChanService";
import { useAppStore } from "@/store/useAppStore";

export function useThreadPosts(board?: string, threadNo?: number) {
  const setThreadPosts = useAppStore((state) => state.setThreadPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!board || !threadNo) {
      setThreadPosts([]);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fourChanService
      .thread(board, threadNo, controller.signal)
      .then((payload) => setThreadPosts(payload.posts))
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setThreadPosts([]);
        setError(cause instanceof Error ? cause.message : "Could not load thread");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [board, threadNo, setThreadPosts]);

  return { isLoading, error };
}
