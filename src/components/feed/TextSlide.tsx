import type { FeedItem } from "@/lib/4chan/types";

type TextSlideProps = {
  item: FeedItem;
  index: number;
};

export function TextSlide({ item, index }: TextSlideProps) {
  return (
    <article className="feedSlide" data-feed-index={index} aria-label={`Text post #${item.postNo}`}>
      <div className="textCard">
        <span className="badge">Text only · #{item.postNo}</span>
        <h2>{item.author}</h2>
        <p>{item.comment || "Post has no readable comment."}</p>
      </div>
    </article>
  );
}
