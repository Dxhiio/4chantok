import { useMemo } from "react";
import { toFeedItems } from "@/lib/4chan/feed";
import { useAppStore } from "@/store/useAppStore";

export function useFeedItems() {
  const board = useAppStore((state) => state.currentBoard?.board);
  const posts = useAppStore((state) => state.threadPosts);
  const showTextOnlyMessages = useAppStore((state) => state.showTextOnlyMessages);

  return useMemo(() => {
    if (!board) return [];
    return toFeedItems(board, posts, showTextOnlyMessages);
  }, [board, posts, showTextOnlyMessages]);
}
