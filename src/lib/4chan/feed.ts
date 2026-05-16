import type { FeedItem, FourChanPost, MediaKind } from "./types";
import { cleanFourChanComment } from "./html";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

function getMediaKind(ext?: string): MediaKind | null {
  const normalized = ext?.toLowerCase();
  if (!normalized) return null;
  if (normalized === ".webm") return "video";
  if (normalized === ".gif") return "gif";
  if (IMAGE_EXTENSIONS.has(normalized)) return "image";
  return null;
}

export function createMediaUrl(board: string, post: FourChanPost) {
  if (!post.tim || !post.ext) return null;
  return `/api/4chan-media/${board}/${post.tim}${post.ext}`;
}

export function createThumbnailUrl(board: string, post: FourChanPost) {
  if (!post.tim) return null;
  return `/api/4chan-media/${board}/${post.tim}s.jpg`;
}

export function normalizePost(board: string, post: FourChanPost): FeedItem {
  const mediaKind = getMediaKind(post.ext);
  const mediaUrl = mediaKind ? createMediaUrl(board, post) : null;
  const thumbnailUrl = createThumbnailUrl(board, post);
  const comment = cleanFourChanComment(post.com);

  return {
    id: post.no,
    board,
    postNo: post.no,
    author: post.name ?? "Anonymous",
    postedAt: post.time,
    comment,
    isTextOnly: !mediaKind || !mediaUrl,
    media:
      mediaKind && mediaUrl
        ? {
            kind: mediaKind,
            url: mediaUrl,
            thumbnailUrl: thumbnailUrl ?? undefined,
            filename: `${post.filename ?? post.tim}${post.ext}`,
            width: post.w,
            height: post.h,
            sizeBytes: post.fsize,
          }
        : undefined,
  };
}

export function toFeedItems(board: string, posts: FourChanPost[], showTextOnlyMessages: boolean) {
  return posts
    .map((post) => normalizePost(board, post))
    .filter((item) => showTextOnlyMessages || Boolean(item.media));
}
