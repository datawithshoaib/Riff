import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-signal text-signal-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_8px_20px_-8px_var(--signal)]",
        className,
      )}
    >
      <span className="flex h-4 items-end gap-[2.5px]">
        <span className="h-2 w-[3px] rounded-full bg-current" />
        <span className="h-4 w-[3px] rounded-full bg-current" />
        <span className="h-2.5 w-[3px] rounded-full bg-current" />
        <span className="h-3.5 w-[3px] rounded-full bg-current" />
      </span>
    </span>
  );
}

export function Brand({
  className,
  markClassName,
  wordmarkClassName,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className={markClassName} />
      <span className="flex items-baseline gap-0.5">
        <span
          className={cn(
            "font-serif text-[1.65rem] leading-none tracking-[-0.01em] text-foreground",
            wordmarkClassName,
          )}
        >
          riff
        </span>
        <span className="size-1.5 rounded-full bg-signal" />
      </span>
    </span>
  );
}
