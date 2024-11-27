"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useTransition } from "react";
import { cn } from "@/utils";

export default function Navigation({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (route: string) => {
    return (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      startTransition(() => {
        router.push(route);
      });
    };
  };

  return (
    <div
      className={cn("w-full", className)}
      data-page-pending={isPending ?? undefined}
    >
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        <Link
          href="/"
          prefetch
          onClick={handleClick("/")}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap",
            "rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background",
            "transition-all focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            pathname === "/" && "bg-white text-gray-900 shadow-sm"
          )}
        >
          Resources
        </Link>
        <Link
          prefetch
          href="/work"
          onClick={handleClick("/work")}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap",
            "rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background",
            "transition-all focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            pathname === "/" && "bg-white text-gray-900 shadow-sm"
          )}
        >
          Work
        </Link>
      </div>
    </div>
  );
}
