"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ReducedMotionProvider } from "@/components/ui/reduced-motion-context";
import { Toaster } from "@/components/ui/toast";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReducedMotionProvider>
        {children}
        <Toaster />
      </ReducedMotionProvider>
    </SessionProvider>
  );
}
