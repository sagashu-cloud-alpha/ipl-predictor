"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ToastTone = "default" | "green" | "red" | "orange";

export function Toast({
  msg,
  tone,
  show,
}: {
  msg: string;
  tone: ToastTone;
  show: boolean;
}) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border bg-popover px-4 py-2 text-sm shadow-md transition-transform duration-300",
        show ? "translate-y-0" : "translate-y-24",
        tone === "green" && "border-emerald-500/40 text-emerald-500",
        tone === "red" && "border-red-500/40 text-red-500",
        tone === "orange" && "border-amber-500/40 text-amber-500"
      )}
    >
      {msg}
    </div>
  );
}

