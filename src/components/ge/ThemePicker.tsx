import { useEffect } from "react";
import { Check, Palette, X } from "lucide-react";
import { THEMES, useTheme, type ThemeId } from "@/lib/theme";
import { BRAND } from "@/lib/branding";
import { AppLogo } from "./AppLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemePicker({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { themeId, setTheme } = useTheme();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-bg/70"
        aria-label="Close appearance"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="appearance-title"
        className="relative z-10 flex max-h-[90%] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border border-border bg-surface shadow-2xl sm:max-h-[85%] sm:rounded-xl"
      >
        <div className="flex items-start gap-3 border-b border-border p-4 pad-top-safe sm:p-5 sm:pt-5">
          <AppLogo size="md" />
          <div className="min-w-0 flex-1">
            <h2 id="appearance-title" className="text-base font-semibold text-fg">
              Appearance
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Color templates for {BRAND.name}. Choice is saved on this device.
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          {THEMES.map((t) => {
            const active = themeId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as ThemeId)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                  active
                    ? "border-border-strong bg-surface-2"
                    : "border-border bg-surface hover:bg-surface-2",
                )}
              >
                <div className="flex shrink-0 gap-1">
                  {t.swatches.map((c) => (
                    <span
                      key={c}
                      className="h-8 w-5 rounded-sm border border-border-strong first:rounded-l-md last:rounded-r-md"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-fg">{t.label}</span>
                    {active && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-accent">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted leading-snug">{t.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-border px-4 py-3 text-[11px] text-subtle sm:px-5">
          Theme doesn't affect layout — pick any look you like.
        </div>
        <div
          style={{
            height: "min(34px, env(safe-area-inset-bottom, 0px))",
            background: "var(--color-surface)",
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}

export function ThemeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      className="shrink-0"
      aria-label="Appearance"
      title="Appearance"
    >
      <Palette className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Theme</span>
    </Button>
  );
}
