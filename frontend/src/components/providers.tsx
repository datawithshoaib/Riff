"use client";

import { ThemeProvider } from "next-themes";

import { HealthProvider } from "@/components/health-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={150}>
        <HealthProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </HealthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
