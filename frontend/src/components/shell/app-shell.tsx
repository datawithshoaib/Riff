"use client";

import { AudioLines, History, Menu, Sparkles, WandSparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Brand } from "@/components/brand";
import { ModeBadge } from "@/components/mode-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Studio", icon: WandSparkles, description: "Screenshot to drafts" },
  { href: "/voice", label: "Your voice", icon: AudioLines, description: "Teach Riff how you write" },
  { href: "/history", label: "History", icon: History, description: "Every past riff" },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-signal transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                active ? "text-signal" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80",
              )}
            />
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{item.label}</span>
              <span className="truncate text-[11px] text-sidebar-foreground/45">
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function HowItWorks() {
  return (
    <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3.5">
      <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/45">
        <Sparkles className="size-3" />
        How it works
      </p>
      <ol className="space-y-2 text-[11.5px] leading-snug text-sidebar-foreground/55">
        <li className="flex gap-2">
          <span className="font-mono text-[10px] text-signal/80">01</span>
          Read the screenshot, keep the idea.
        </li>
        <li className="flex gap-2">
          <span className="font-mono text-[10px] text-signal/80">02</span>
          Strip the author&apos;s phrasing.
        </li>
        <li className="flex gap-2">
          <span className="font-mono text-[10px] text-signal/80">03</span>
          Write three drafts in your voice.
        </li>
      </ol>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex min-h-dvh bg-background">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-halo" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-70 [mask-image:radial-gradient(120%_90%_at_60%_0%,black_20%,transparent_78%)]"
      />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-sidebar-border bg-sidebar/75 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/" aria-label="Riff home" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Brand />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/35">
            Workspace
          </p>
          <NavLinks />
        </div>

        <div className="space-y-3 px-3 pb-4">
          <HowItWorks />
          <div className="flex items-center justify-between px-1">
            <ModeBadge />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl lg:hidden">
          <Link href="/" aria-label="Riff home" className="rounded-lg">
            <Brand wordmarkClassName="text-2xl" markClassName="size-8" />
          </Link>
          <div className="flex items-center gap-1.5">
            <ModeBadge compact />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] gap-0 bg-sidebar p-0">
                <SheetHeader className="border-b border-sidebar-border p-4">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <SheetDescription className="sr-only">
                    Move between the studio, voice profiles and history.
                  </SheetDescription>
                  <Brand />
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-3 py-4">
                  <NavLinks onNavigate={() => setOpen(false)} />
                  <div className="mt-6">
                    <HowItWorks />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-sidebar-border p-4">
                  <ModeBadge />
                  <ThemeToggle />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-7 sm:px-6 lg:px-10 lg:pb-24 lg:pt-12">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-6xl px-4 pb-8 text-xs text-muted-foreground sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
            <p>Ideas are free. Words should be yours.</p>
            <p className="font-mono text-[10.5px] tracking-tight text-muted-foreground/70">
              insight in · original out
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
