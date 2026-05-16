# 4chantok

A privacy-conscious 4chan media viewer with a TikTok-style vertical feed.

4chantok lets you browse 4chan boards, open thread catalogs, and view thread media in a fullscreen vertical scroller. It is built to avoid loading an entire thread's media upfront: heavy media is mounted on demand when a slide becomes visible.

## Features

- Browse available 4chan boards via the public JSON API.
- View a visual thread catalog with thumbnail-backed cards.
- Open a thread in a vertical scroll-snap media feed.
- Show only media posts by default.
- Optional toggle to include text-only posts in the feed.
- Autoplay WebM videos when visible.
- GIFs and images load only when their slide becomes visible.
- Same-origin API proxy for:
  - avoiding browser CORS issues,
  - enforcing a simple 1 request/second JSON API limiter,
  - forwarding media range requests for smoother video playback,
  - sending strict no-store headers for media responses.
- Sanitizes 4chan HTML comments before rendering text.

## Tech Stack

- [Next.js](https://nextjs.org/) App Router
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zustand](https://zustand-demo.pmnd.rs/) for lightweight global state
- Plain CSS for the initial UI system

## Requirements

- Node.js `^20.19.0`, `^22.13.0`, or `>=24.0.0`
- npm
- Internet access to:
  - `https://a.4cdn.org`
  - `https://i.4cdn.org`

## Getting Started

Install dependencies:

```bash
nvm use
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
```

Starts the local development server.

```bash
npm run typecheck
```

Runs TypeScript without emitting files.

```bash
npm run lint
```

Runs Next.js ESLint checks.

```bash
npm run build
```

Creates a production build.

```bash
npm run start
```

Starts a production server after a production build has been created.

## How It Works

### 4chan JSON Proxy

Client code calls local routes under:

```txt
/api/4chan/*
```

Those routes proxy the official 4chan JSON API:

- Boards: `https://a.4cdn.org/boards.json`
- Catalog: `https://a.4cdn.org/[board]/catalog.json`
- Thread: `https://a.4cdn.org/[board]/thread/[thread_number].json`

The server proxy validates allowed paths and queues upstream JSON requests at 1 request per second.

### Media Proxy

Media is requested through:

```txt
/api/4chan-media/[board]/[file]
```

The media proxy forwards byte-range requests so the browser can stream WebM files instead of waiting for full downloads. It also sends privacy-focused no-store headers.

Important: a browser must still buffer bytes in memory or temporary internal storage to play media. This project avoids app-managed storage and persistent HTTP caching, but no web app can guarantee that zero media bytes ever touch browser-managed temporary buffers.

### On-Demand Media Loading

The feed renders lightweight placeholders for inactive slides. The actual `<video>` or `<img>` element is mounted only when the slide is active or locally visible. This prevents the browser from eagerly loading a whole thread.

## Project Structure

```txt
src
├─ app
│  ├─ api
│  │  ├─ 4chan
│  │  └─ 4chan-media
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components
│  ├─ boards
│  ├─ catalog
│  └─ feed
├─ features
│  ├─ boards
│  ├─ catalog
│  ├─ chan
│  ├─ feed
│  └─ thread
├─ lib
│  └─ 4chan
├─ server
└─ store
```

## Browser Notes

- WebM support varies by browser and codec, especially on iOS Safari.
- Autoplay requires muted playback in modern browsers.
- For the strongest practical privacy during local use, run the app in a private/incognito browser window.

## Deployment Notes

The included JSON API rate limiter is process-local. That is fine for local development or a single server process.

For multi-instance production deployments, replace it with a shared limiter backed by Redis, Upstash, or a queue.

## Legal / Content Notice

4chantok is an unofficial viewer for publicly available 4chan API data. It is not affiliated with 4chan.

4chan content is user-generated and may include adult or offensive material depending on the selected board. Use responsibly and follow applicable laws and the 4chan API rules.
