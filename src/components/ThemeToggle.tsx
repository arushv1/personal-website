"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem("av-theme");
    const initial = saved === "light" || saved === "dark" ? saved : "dark";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("av-theme", next);
  };

  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle light and dark palette">
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
