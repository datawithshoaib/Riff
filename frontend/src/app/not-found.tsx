import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        404
      </p>
      <h1 className="font-serif text-4xl tracking-tight">
        This page has no <span className="italic text-signal">riff</span>.
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        The link may be old, or the page moved. The studio is still where the work happens.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">
          <ArrowLeft />
          Back to studio
        </Link>
      </Button>
    </div>
  );
}
