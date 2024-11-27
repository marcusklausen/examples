"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";
import { useThrottleRouter } from "src/context/throttle-context";
import { cn } from "src/utils";
import { buttonVariants } from "@/components/ui/button";

export default function ThrottleDropdown() {
  const { throttleMap, throttle, setThrottle } = useThrottleRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "flex flex-row-reverse gap-2 items-end justify-center text-sm text-gray-800",
          !throttle && "text-gray-400"
        )}
      >
        <MoreHorizontalIcon className="mb-0.5" />
        {!throttle ? "No throttle" : `Throttle: ${throttleMap[throttle]}`}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={throttle.toString()}>
          {Object.entries(throttleMap).map(([key, value]) => (
            <DropdownMenuRadioItem
              key={key}
              value={key}
              onClick={() => {
                setThrottle(Number(key) as keyof typeof throttleMap);
              }}
            >
              {value}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
