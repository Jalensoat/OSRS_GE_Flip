import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tabular",
  {
    variants: {
      variant: {
        default: "border-border bg-surface-2 text-muted",
        gain: "border-gain/30 bg-gain/10 text-gain",
        loss: "border-loss/30 bg-loss/10 text-loss",
        warn: "border-warn/30 bg-warn/10 text-warn",
        accent: "border-accent/30 bg-accent/10 text-accent",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
