export type FourChanBoard = {
  board: string;
  title: string;
  ws_board: 0 | 1;
  per_page: number;
  pages: number;
  max_filesize: number;
  max_webm_filesize?: number;
  max_comment_chars: number;
  bump_limit: number;
  image_limit: number;
  cooldowns?: Record<string, number>;
};

export type BoardsResponse = {
  boards: FourChanBoard[];
};

export type FourChanCatalogPage = {
  page: number;
  threads: FourChanPost[];
};

export type FourChanThreadResponse = {
  posts: FourChanPost[];
};

export type FourChanPost = {
  no: number;
  resto?: number;
  now?: string;
  time?: number;
  name?: string;
  sub?: string;
  com?: string;
  filename?: string;
  ext?: string;
  w?: number;
  h?: number;
  tn_w?: number;
  tn_h?: number;
  tim?: number;
  fsize?: number;
  md5?: string;
  replies?: number;
  images?: number;
  semantic_url?: string;
};

export type MediaKind = "image" | "gif" | "video";

export type FeedItem = {
  id: number;
  board: string;
  postNo: number;
  author: string;
  postedAt?: number;
  comment: string;
  isTextOnly: boolean;
  media?: {
    kind: MediaKind;
    url: string;
    thumbnailUrl?: string;
    filename: string;
    width?: number;
    height?: number;
    sizeBytes?: number;
  };
};
