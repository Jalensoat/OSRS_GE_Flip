import { useEffect } from "react";
import { applyTheme, useTheme } from "@/lib/theme";

/** Applies persisted theme on first client paint. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useTheme((s) => s.themeId);

  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  return <>{children}</>;
}
