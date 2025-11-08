import {
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";

type Mode = "light" | "dark" | "system";
const KEY = "theme";

function getSystemMode(): Mode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(mode: Mode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement; // <html>
  const effective = mode === "system" ? getSystemMode() : mode;
  root.classList.toggle("dark", effective === "dark");
}

type ThemeCtx = { mode: Mode; setMode: (m: Mode) => void };
const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem(KEY) as Mode) || "system";
  });

  // apply on mount + when mode changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    apply(mode);
    localStorage.setItem(KEY, mode);
  }, [mode]);

  // react to OS changes when on "system"
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => mode === "system" && apply("system");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [mode]);

  // expose setter on window for debugging (optional)
  useEffect(() => {
    if (typeof window === "undefined") return;
    // @ts-ignore
    window.__setTheme = setMode;
    return () => {
      if (typeof window !== "undefined") {
        // @ts-ignore
        delete window.__setTheme;
      }
    };
  }, [setMode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

