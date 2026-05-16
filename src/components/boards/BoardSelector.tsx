"use client";

import { useState } from "react";
import { useBoards } from "@/features/boards/useBoards";
import { useAppStore } from "@/store/useAppStore";

export function BoardSelector() {
  const [query, setQuery] = useState("");
  const currentBoard = useAppStore((state) => state.currentBoard);
  const setCurrentBoard = useAppStore((state) => state.setCurrentBoard);
  const { boards, isLoading, error } = useBoards(query);

  return (
    <section>
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Step 1</p>
          <h2>Boards</h2>
        </div>
        <span className="badge">{boards.length}</span>
      </div>

      <input
        className="searchInput"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search /wsg/, anime, tech…"
        aria-label="Search boards"
      />

      {isLoading ? <p className="muted">Loading boards…</p> : null}
      {error ? <p className="errorText">{error}</p> : null}

      <div className="boardList">
        {boards.map((board) => (
          <button
            key={board.board}
            className="boardButton"
            data-active={currentBoard?.board === board.board}
            type="button"
            onClick={() => setCurrentBoard(board)}
          >
            <span className="boardTitle">/{board.board}/ — {board.title}</span>
            <span className="boardMeta">
              {board.ws_board ? "NSFW" : "SFW"} · {board.pages} pages · {board.image_limit} images/thread
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
