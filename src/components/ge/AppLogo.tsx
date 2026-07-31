import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

/**
 * Official brand mark. Swap `BRAND.logoSrc` / files in /public to rebrand.
 */
export function AppLogo({
  size = "md",
  className,
  alt = BRAND.name,
}: {
  size?: Size;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={BRAND.logoSrc}
      alt={alt}
      width={size === "lg" ? 44 : size === "md" ? 36 : 32}
      height={size === "lg" ? 44 : size === "md" ? 36 : 32}
      className={cn(
        "shrink-0 rounded-[22%] object-cover shadow-sm ring-1 ring-border",
        sizeMap[size],
        className,
      )}
      draggable={false}
    />
  );
}
