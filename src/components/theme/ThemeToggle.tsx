import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();

  // cycles: system → light → dark → system ...
  function next() {
    const order = ["system", "light", "dark"] as const;
    const idx = order.indexOf(mode as any);
    setMode(order[(idx + 1) % order.length]);
  }

  const label =
    mode === "system" ? "Theme: System" : mode === "light" ? "Theme: Light" : "Theme: Dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      aria-pressed={mode === "dark"}
      title={`${label} (click to change)`}
      onClick={next}
      className="relative rounded-full"
    >
      {/* show both for smooth swap via dark class */}
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

