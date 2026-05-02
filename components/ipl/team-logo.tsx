"use client";

import * as React from "react";

import type { TeamId } from "@/components/ipl/types";
import { teamById } from "@/components/ipl/data";
import { cn } from "@/lib/utils";

export function TeamLogo({
  id,
  size = 24,
  className,
}: {
  id: TeamId;
  size?: number;
  className?: string;
}) {
  const t = teamById(id);
  const fontSize = Math.max(10, Math.floor(size * 0.36));
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white font-bold",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize,
        background: t.color,
        fontFamily: "var(--font-mono)",
      }}
    >
      {t.short.slice(0, 2)}
    </div>
  );
}

