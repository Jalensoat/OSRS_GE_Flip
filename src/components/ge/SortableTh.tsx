import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortDir } from "@/lib/osrs/listFilters";

export function SortableTh({
  label,
  active,
  dir,
  onClick,
  align = "right",
  className,
  title,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
  className?: string;
  title?: string;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex w-full items-center gap-1 text-[11px] font-medium uppercase tracking-wide transition-colors",
        align === "right" ? "justify-end" : "justify-start",
        active ? "text-fg" : "text-subtle hover:text-muted",
        className,
      )}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="truncate">{label}</span>
      <Icon className={cn("h-3 w-3 shrink-0", active ? "text-accent" : "opacity-60")} />
    </button>
  );
}
