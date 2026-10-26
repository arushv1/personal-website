"use client";

import { useEffect, useRef } from "react";

// A grid of whole slide tiles that scales up, tile by tile, as it scrolls
// into view: the zoom into a slide, kept to transform and opacity only so
// it never reflows the page text. Tiles are decorative, so aria-hidden.
const TILES = [
  "tile-a", "tile-b", "tile-c", "tile-d",
  "tile-e", "tile-f", "tile-g", "tile-h",
  "tile-i", "tile-j", "tile-k", "tile-l",
];

export default function TileGrid({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="tile-grid" role="img" aria-label={label} aria-hidden="true">
      {TILES.map((tone, i) => (
        <span key={tone} className={`tile ${tone}`} style={{ transitionDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}
