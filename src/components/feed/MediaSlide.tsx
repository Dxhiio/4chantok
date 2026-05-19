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

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export function MediaSlide({ item, index, isActive }: MediaSlideProps) {
  const slideRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const singleTapTimerRef = useRef<number | null>(null);
  const playerHideTimerRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ at: number; side: "left" | "right" } | null>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.1);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLocallyVisible, setIsLocallyVisible] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const media = item.media;
  const shouldPlay = useMemo(() => isActive || isLocallyVisible, [isActive, isLocallyVisible]);
  const shouldLoadMedia = shouldPlay;

  const primeVideoForAutoplay = useCallback(
    (video: HTMLVideoElement, nextMuted = muted, nextVolume = volume) => {
      video.defaultMuted = nextMuted;
      video.muted = nextMuted;
      video.volume = nextVolume;
      video.playsInline = true;
      video.autoplay = true;
      video.loop = true;
      if (nextMuted) {
        video.setAttribute("muted", "");
      } else {
        video.removeAttribute("muted");
      }
      video.setAttribute("playsinline", "");
      video.setAttribute("autoplay", "");
    },
    [muted, volume],
  );

  const attemptPlayback = useCallback(async (force = false, mutedOverride = muted) => {
    const video = videoRef.current;
    if (!video || media?.kind !== "video") return;

    if (!shouldPlay || (!force && isUserPaused)) {
      video.pause();
      setPlaybackState("idle");
      return;
    }

    primeVideoForAutoplay(video, mutedOverride, volume);
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
  }, [isUserPaused, media?.kind, muted, primeVideoForAutoplay, shouldPlay, volume]);

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

  useEffect(() => {
    if (!shouldPlay) {
      setIsUserPaused(false);
    }
  }, [shouldPlay]);

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current !== null) {
        window.clearTimeout(singleTapTimerRef.current);
      }
      if (playerHideTimerRef.current !== null) {
        window.clearTimeout(playerHideTimerRef.current);
      }
    };
  }, []);

  const schedulePlayerHide = useCallback(() => {
    if (playerHideTimerRef.current !== null) {
      window.clearTimeout(playerHideTimerRef.current);
    }

    if (!shouldLoadMedia || media?.kind !== "video" || playbackState !== "playing" || isUserPaused) {
      setIsPlayerVisible(true);
      return;
    }

    playerHideTimerRef.current = window.setTimeout(() => {
      setIsPlayerVisible(false);
      playerHideTimerRef.current = null;
    }, 2_200);
  }, [isUserPaused, media?.kind, playbackState, shouldLoadMedia]);

  const revealPlayer = useCallback(() => {
    setIsPlayerVisible(true);
    schedulePlayerHide();
  }, [schedulePlayerHide]);

  useEffect(() => {
    if (media?.kind !== "video" || !shouldLoadMedia) return;
    schedulePlayerHide();
  }, [media?.kind, schedulePlayerHide, shouldLoadMedia]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video || media?.kind !== "video") return;

    if (video.paused) {
      revealPlayer();
      setIsUserPaused(false);
      void attemptPlayback(true);
      return;
    }

    revealPlayer();
    video.pause();
    setIsUserPaused(true);
    setPlaybackState("idle");
  }, [attemptPlayback, media?.kind, revealPlayer]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    const nextMuted = !muted;

    setMuted(nextMuted);
    revealPlayer();

    if (video) {
      video.muted = nextMuted;
      if (nextMuted) {
        video.setAttribute("muted", "");
      } else {
        video.removeAttribute("muted");
      }
    }

    if (!nextMuted) {
      void attemptPlayback(true, nextMuted);
    }
  }, [attemptPlayback, muted, revealPlayer]);

  const handleVolumeChange = useCallback(
    (nextVolume: number) => {
      const clampedVolume = Math.min(Math.max(nextVolume, 0), 1);
      const video = videoRef.current;
      revealPlayer();

      setVolume(clampedVolume);
      setMuted(clampedVolume === 0);

      if (video) {
        video.volume = clampedVolume;
        video.muted = clampedVolume === 0;
        if (clampedVolume === 0) {
          video.setAttribute("muted", "");
        } else {
          video.removeAttribute("muted");
        }
      }

      if (clampedVolume > 0) {
        void attemptPlayback(true, false);
      }
    },
    [attemptPlayback, revealPlayer],
  );

  const handleSeek = useCallback(
    (nextTime: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(duration) || duration <= 0) return;

      revealPlayer();
      const clampedTime = Math.min(Math.max(nextTime, 0), duration);
      video.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    },
    [duration, revealPlayer],
  );

  const seekBy = useCallback(
    (deltaSeconds: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(duration) || duration <= 0) return;

      handleSeek(video.currentTime + deltaSeconds);
    },
    [duration, handleSeek],
  );

  const handleVideoTap = useCallback(
    (event: React.PointerEvent<HTMLVideoElement>) => {
      const video = videoRef.current;
      if (!video || media?.kind !== "video") return;

      const rect = event.currentTarget.getBoundingClientRect();
      const side = event.clientX < rect.left + rect.width / 2 ? "left" : "right";
      const now = window.performance.now();
      const previousTap = lastTapRef.current;
      const isDoubleTap = Boolean(previousTap && previousTap.side === side && now - previousTap.at <= 280);

      if (isDoubleTap) {
        revealPlayer();
        if (singleTapTimerRef.current !== null) {
          window.clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }

        lastTapRef.current = null;
        seekBy(side === "left" ? -5 : 5);
        return;
      }

      lastTapRef.current = { at: now, side };

      if (singleTapTimerRef.current !== null) {
        window.clearTimeout(singleTapTimerRef.current);
      }

      singleTapTimerRef.current = window.setTimeout(() => {
        revealPlayer();
        togglePlayPause();
        singleTapTimerRef.current = null;
      }, 285);
    },
    [media?.kind, revealPlayer, seekBy, togglePlayPause],
  );

  if (!media) return null;

  const caption = item.comment || media.filename;

  return (
    <article
      ref={slideRef}
      className="feedSlide"
      data-feed-index={index}
      aria-label={`Post #${item.postNo}`}
      onPointerMove={media.kind === "video" ? revealPlayer : undefined}
    >
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
            onLoadedMetadata={(event) => {
              setDuration(event.currentTarget.duration);
              setCurrentTime(event.currentTarget.currentTime);
            }}
            onDurationChange={(event) => setDuration(event.currentTarget.duration)}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onPlay={() => setPlaybackState("playing")}
            onPause={() => {
              if (shouldPlay && !isUserPaused) return;
              setPlaybackState("idle");
            }}
            onError={() => setPlaybackState("error")}
            onPointerUp={handleVideoTap}
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
              onClick={toggleMute}
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

      {media.kind === "video" && shouldLoadMedia ? (
        <div
          className="mediaPlayer"
          data-visible={isPlayerVisible || isUserPaused || playbackState !== "playing"}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={revealPlayer}
        >
          <div className="mediaPlayerRow">
            <button className="playerButton" type="button" onClick={togglePlayPause}>
              {playbackState === "playing" && !isUserPaused ? "Pause" : "Play"}
            </button>
            <span className="timeLabel">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <button className="playerButton" type="button" onClick={toggleMute}>
              {muted ? "Muted" : "Sound"}
            </button>
          </div>

          <input
            className="seekControl"
            type="range"
            min={0}
            max={Number.isFinite(duration) && duration > 0 ? duration : 0}
            step="0.1"
            value={Math.min(currentTime, Number.isFinite(duration) && duration > 0 ? duration : currentTime)}
            aria-label="Seek video"
            onChange={(event) => handleSeek(Number(event.currentTarget.value))}
          />

          <label className="volumeControl">
            <span>Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step="0.05"
              value={volume}
              aria-label="Video volume"
              onChange={(event) => handleVolumeChange(Number(event.currentTarget.value))}
            />
          </label>
        </div>
      ) : null}
    </article>
  );
}
