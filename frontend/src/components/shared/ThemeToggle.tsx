import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkStored = localStorage.getItem("ccms-theme") === "dark";
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("ccms-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("ccms-theme", "light");
      }
      return next;
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-2xl transition-all duration-200 hover:bg-white/10 group"
      style={{ color: "var(--text-muted)" }}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-colors group-hover:text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 transition-colors group-hover:text-indigo-400" />
      )}
    </button>
  );
}
