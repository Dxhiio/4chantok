"use client";

import { BoardSelector } from "@/components/boards/BoardSelector";
import { ThreadCatalog } from "@/components/catalog/ThreadCatalog";
import { TikTokScroller } from "@/components/feed/TikTokScroller";
import { useThreadPosts } from "@/features/thread/useThreadPosts";
import { useAppStore } from "@/store/useAppStore";

export default function HomePage() {
  const currentBoard = useAppStore((state) => state.currentBoard);
  const currentThread = useAppStore((state) => state.currentThread);
  const showTextOnlyMessages = useAppStore((state) => state.showTextOnlyMessages);
  const setShowTextOnlyMessages = useAppStore((state) => state.setShowTextOnlyMessages);
  const { isLoading, error } = useThreadPosts(currentBoard?.board, currentThread?.no);

  return (
    <main className="appShell">
      <aside className="sidebar" aria-label="Boards">
        <header className="brandBlock">
          <p className="eyebrow">4chan media explorer</p>
          <h1>4chantok</h1>
          <p className="muted">
            Browse 4chan boards, open media-heavy threads, and scroll through posts in a focused vertical feed.
          </p>
        </header>
        <BoardSelector />
      </aside>

      <section className="catalogPanel" aria-label="Threads">
        <ThreadCatalog />
      </section>

      <section className="viewerPanel" aria-label="Media viewer">
        <div className="viewerToolbar">
          <div>
            <p className="eyebrow">Active thread</p>
            <strong>{currentBoard && currentThread ? `/${currentBoard.board}/ #${currentThread.no}` : "Select a thread"}</strong>
          </div>
          <label className="switchControl">
            <span>Show text-only posts</span>
            <input
              type="checkbox"
              checked={showTextOnlyMessages}
              onChange={(event) => setShowTextOnlyMessages(event.target.checked)}
            />
          </label>
        </div>

        {isLoading ? <div className="emptyState">Loading thread…</div> : null}
        {error ? <div className="emptyState errorText">{error}</div> : null}
        {!isLoading && !error ? <TikTokScroller /> : null}
      </section>
    </main>
  );
}
