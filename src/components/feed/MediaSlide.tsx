"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeedItem } from "@/lib/4chan/types";
import { formatBytes } from "@/lib/format";

type MediaSlideProps = {
  item: FeedItem;
  index: number;
  isActive: boolean;
};

type PlaybackState = "idle" | "loading" | "playing" | "blocked" | "error";

export function MediaSlide({ item, index, isActive }: MediaSlideProps) {
  const slideRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [isLocallyVisible, setIsLocallyVisible] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const media = item.media;
  const shouldPlay = useMemo(() => isActive || isLocallyVisible, [isActive, isLocallyVisible]);
  const shouldLoadMedia = shouldPlay;

  const primeVideoForAutoplay = useCallback(
    (video: HTMLVideoElement) => {
      video.defaultMuted = true;
      video.muted = muted;
      video.playsInline = true;
      video.autoplay = true;
      video.loop = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("autoplay", "");
    },
    [muted],
  );

  const attemptPlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video || media?.kind !== "video") return;

    if (!shouldPlay) {
      video.pause();
      setPlaybackState("idle");
      return;
    }

    primeVideoForAutoplay(video);
    setPlaybackState(video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA ? "idle" : "loading");

    if (video.readyState === HTMLMediaElement.HAVE_NOTHING) {
      video.load();
    }

    try {
      await video.play();
      setPlaybackState("playing");
    } catch {
      if (!video.muted) {
        video.muted = true;
        setMuted(true);
      }

      try {
        await video.play();
        setPlaybackState("playing");
      } catch {
        setPlaybackState("blocked");
      }
    }
  }, [media?.kind, primeVideoForAutoplay, shouldPlay]);

  useEffect(() => {
    void attemptPlayback();
  }, [attemptPlayback]);

  useEffect(() => {
    const slide = slideRef.current;
    if (!slide) return;

    let frame: number | null = null;

    const computeVisibility = () => {
      const rect = slide.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const visiblePixels = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
      const visibleRatio = visiblePixels / Math.max(rect.height, 1);
      setIsLocallyVisible(visibleRatio >= 0.45);
      frame = null;
    };

    const scheduleVisibilityCheck = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(computeVisibility);
    };

    computeVisibility();
    window.addEventListener("scroll", scheduleVisibilityCheck, true);
    window.addEventListener("resize", scheduleVisibilityCheck);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleVisibilityCheck, true);
      window.removeEventListener("resize", scheduleVisibilityCheck);
    };
  }, []);

  if (!media) return null;

  const caption = item.comment || media.filename;

  return (
    <article ref={slideRef} className="feedSlide" data-feed-index={index} aria-label={`Post #${item.postNo}`}>
      <div className="mediaFrame">
        {!shouldLoadMedia ? (
          <div className="mediaPlaceholder">
            <span className="badge">{media.kind.toUpperCase()}</span>
            <p>Media loads when this slide becomes visible</p>
          </div>
        ) : media.kind === "video" ? (
          <video
            ref={videoRef}
            src={media.url}
            poster={media.thumbnailUrl}
            playsInline
            loop
            muted={muted}
            autoPlay
            preload="metadata"
            onCanPlay={() => void attemptPlayback()}
            onLoadedData={() => void attemptPlayback()}
            onError={() => setPlaybackState("error")}
            onClick={() => setMuted((value) => !value)}
          />
        ) : media.kind === "gif" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={caption} loading="eager" decoding="async" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={caption} loading="eager" decoding="async" />
        )}
      </div>

      <div className="slideOverlay">
        <div className="slideCopy">
          <span className="badge">
            #{item.postNo} · {media.kind.toUpperCase()} {formatBytes(media.sizeBytes)}
          </span>
          {item.comment ? <p>{item.comment}</p> : <p className="muted">{media.filename}</p>}
        </div>

        <div className="mediaActions">
          {media.kind === "video" ? (
            <button
              className="iconButton"
              type="button"
              onClick={() => {
                setMuted((value) => !value);
                void attemptPlayback();
              }}
            >
              {muted ? "Unmute" : "Mute"}
            </button>
          ) : null}
          {media.kind === "video" && playbackState !== "playing" ? (
            <button className="iconButton" type="button" onClick={() => void attemptPlayback()}>
              {playbackState === "error" ? "Video error" : playbackState === "blocked" ? "Blocked" : "Loading"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
