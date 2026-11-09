import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#A4B49B] bg-[#F7F4ED] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71866E]",
        className
      )}
    >
      {children}
    </span>
  );
}
