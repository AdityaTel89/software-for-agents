'use client';

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    const timer = setTimeout(() => {
      setTheme(isDark ? "dark" : "light");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setTheme(nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="font-mono text-[9px] lg:text-[10px] border border-foreground/30 px-3 py-1 bg-transparent hover:bg-foreground hover:text-background transition-colors uppercase tracking-wider cursor-pointer"
      title="Toggle UI Color Theme"
    >
      [ {theme} ]
    </button>
  );
}
