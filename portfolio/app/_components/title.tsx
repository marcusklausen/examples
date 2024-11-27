"use client";

import { usePathname } from "next/navigation";
import React from "react";

export default function Title() {
  const pathname = usePathname();

  const titleMap = {
    "/": "Resources",
    "/work": "Work",
  };

  return (
    <h1 className="text-2xl font-medium tracking-tight">
      {titleMap[pathname as keyof typeof titleMap]}
    </h1>
  );
}
