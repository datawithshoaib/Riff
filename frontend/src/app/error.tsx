"use client";

import { ArrowLeft, RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md gap-4 border-border/70 bg-card/70 p-6 text-center backdrop-blur-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive">
          <TriangleAlert className="size-5" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-serif text-2xl">Something skipped a beat.</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {error.message || "An unexpected error stopped this page from loading."}
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={reset} variant="outline">
            <RefreshCw />
            Try again
          </Button>
          <Button asChild>
            <Link href="/">
              <ArrowLeft />
              Back to studio
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
