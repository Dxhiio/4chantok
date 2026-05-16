"use client";

import type { CSSProperties } from "react";
import { useCatalog } from "@/features/catalog/useCatalog";
import { createThumbnailUrl } from "@/lib/4chan/feed";
import { truncateText } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";

export function ThreadCatalog() {
  const currentBoard = useAppStore((state) => state.currentBoard);
  const currentThread = useAppStore((state) => state.currentThread);
  const setCurrentThread = useAppStore((state) => state.setCurrentThread);
  const { threads, isLoading, error } = useCatalog(currentBoard?.board);

  if (!currentBoard) {
    return <div className="emptyState">Select a board to browse its catalog.</div>;
  }

  return (
    <section>
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Step 2</p>
          <h2>/{currentBoard.board}/ threads</h2>
        </div>
        <span className="badge">{threads.length}</span>
      </div>

      {isLoading ? <p className="muted">Loading catalog…</p> : null}
      {error ? <p className="errorText">{error}</p> : null}

      <div className="threadList">
        {threads.map((thread) => {
          const thumbnailUrl = createThumbnailUrl(currentBoard.board, thread);
          const thumbnailStyle = thumbnailUrl
            ? ({ "--thread-thumb": `url("${thumbnailUrl}")` } as CSSProperties)
            : undefined;

          return (
            <button
              key={thread.no}
              className="threadButton"
              data-active={currentThread?.no === thread.no}
              data-has-thumb={Boolean(thumbnailUrl)}
              style={thumbnailStyle}
              type="button"
              onClick={() => setCurrentThread({ no: thread.no, title: thread.title })}
            >
              <span className="threadMeta">
                #{thread.no} · {thread.replies ?? 0} replies · {thread.images ?? 0} media
              </span>
              <span className="threadTitle">{truncateText(thread.title, 88)}</span>
              {thread.preview ? <span className="threadPreview">{truncateText(thread.preview, 130)}</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
