"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MediaSlide } from "./MediaSlide";
import { TextSlide } from "./TextSlide";
import { useFeedItems } from "@/features/feed/useFeedItems";

export function TikTokScroller() {
  const items = useFeedItems();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const syncActiveIndex = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const scrollerCenter = scrollerRect.top + scrollerRect.height / 2;
    const slides = Array.from(scroller.querySelectorAll<HTMLElement>("[data-feed-index]"));

    const closest = slides.reduce(
      (winner, slide) => {
        const rect = slide.getBoundingClientRect();
        const slideCenter = rect.top + rect.height / 2;
        const distance = Math.abs(slideCenter - scrollerCenter);
        const index = Number(slide.dataset.feedIndex ?? 0);

        return distance < winner.distance ? { index, distance } : winner;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    );

    setActiveIndex(Math.min(Math.max(closest.index, 0), Math.max(items.length - 1, 0)));
  }, [items.length]);

  useEffect(() => {
    setActiveIndex(0);
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [items]);

  useEffect(() => {
    syncActiveIndex();
  }, [syncActiveIndex]);

  const handleScroll = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      syncActiveIndex();
      animationFrameRef.current = null;
    });
  }, [syncActiveIndex]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (items.length === 0) {
    return <div className="emptyState">Select a media thread or enable text-only posts.</div>;
  }

  return (
    <div ref={scrollerRef} className="feedScroller" aria-label="Vertical post feed" onScroll={handleScroll}>
      {items.map((item, index) =>
        item.media ? (
          <MediaSlide key={item.id} item={item} index={index} isActive={index === activeIndex} />
        ) : (
          <TextSlide key={item.id} item={item} index={index} />
        ),
      )}
    </div>
  );
}
