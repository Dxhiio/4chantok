import { create } from "zustand";
import type { FourChanBoard, FourChanPost } from "@/lib/4chan/types";

type CurrentThread = {
  no: number;
  title: string;
};

type AppState = {
  currentBoard: FourChanBoard | null;
  currentThread: CurrentThread | null;
  showTextOnlyMessages: boolean;
  threadPosts: FourChanPost[];
  setCurrentBoard: (board: FourChanBoard) => void;
  setCurrentThread: (thread: CurrentThread) => void;
  setShowTextOnlyMessages: (value: boolean) => void;
  setThreadPosts: (posts: FourChanPost[]) => void;
};

export const useAppStore = create<AppState>((set) => ({
  currentBoard: null,
  currentThread: null,
  showTextOnlyMessages: false,
  threadPosts: [],
  setCurrentBoard: (board) => set({ currentBoard: board, currentThread: null, threadPosts: [] }),
  setCurrentThread: (thread) => set({ currentThread: thread, threadPosts: [] }),
  setShowTextOnlyMessages: (value) => set({ showTextOnlyMessages: value }),
  setThreadPosts: (posts) => set({ threadPosts: posts }),
}));
