import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { getItemIconUrl } from "@/lib/osrs/api";

export function ItemIcon({
  icon,
  name,
  size = "md",
  className,
}: {
  icon?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = getItemIconUrl({ icon });
  const dim =
    size === "sm" ? "h-7 w-7" : size === "lg" ? "h-12 w-12" : "h-9 w-9";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-sm bg-surface-2 border border-border",
        dim,
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          width={size === "lg" ? 36 : 28}
          height={size === "lg" ? 36 : 28}
          className="max-h-[85%] max-w-[85%] object-contain pixelated"
          style={{ imageRendering: "pixelated" }}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Package className="h-3.5 w-3.5 text-subtle" aria-hidden />
      )}
      <span className="sr-only">{name}</span>
    </div>
  );
}
