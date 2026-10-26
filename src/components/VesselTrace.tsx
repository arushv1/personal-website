"use client";

import { useEffect, useRef } from "react";

// An original branching vessel line that draws itself as its section scrolls
// into view: the stroke starts fully offset and traces to full length once.
// Motion is transform and stroke only, so it never reflows the page text.
export default function VesselTrace({ label }: { label: string }) {
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
    <div ref={ref} className="vessel-trace" role="img" aria-label={label}>
      <svg viewBox="0 0 600 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <path
          className="vessel-main"
          pathLength={1}
          d="M 10 60 C 90 20, 150 100, 230 60 S 380 20, 450 60 S 560 100, 590 55"
          fill="none"
        />
        <path
          className="vessel-branch"
          pathLength={1}
          d="M 150 78 C 180 95, 210 100, 240 92"
          fill="none"
        />
        <path
          className="vessel-branch"
          pathLength={1}
          d="M 300 45 C 330 25, 360 28, 385 40"
          fill="none"
        />
        <path
          className="vessel-branch"
          pathLength={1}
          d="M 470 70 C 500 88, 530 90, 555 82"
          fill="none"
        />
        <circle className="vessel-node" cx="10" cy="60" r="4" />
        <circle className="vessel-node" cx="230" cy="60" r="3" />
        <circle className="vessel-node" cx="450" cy="60" r="3" />
        <circle className="vessel-node" cx="590" cy="55" r="4" />
      </svg>
    </div>
  );
}
