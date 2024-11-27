"use client";

import { Hourglass } from "lucide-react";
import Form from "next/form";
import { useSearchParams } from "next/navigation";
import React, { useTransition } from "react";
import { useThrottleRouter } from "../../context/throttle-context";

export default function Search() {
  const params = useSearchParams();
  const query = params.get("query") || "";
  const router = useThrottleRouter();

  const [isPending, startTransition] = useTransition();

  const handleSearch = (formData: FormData) => {
    const query = formData.get("query") as string;

    startTransition(() => {
      if (query) {
        router.setParam("query", query);
      } else router.push("/");
    });
  };

  return (
    <Form
      action={handleSearch}
      className="relative"
      data-pending={isPending ? "" : undefined}
    >
      <div className="relative">
        <input
          key={query}
          type="text"
          name="query"
          defaultValue={query}
          placeholder="Search resources..."
          autoComplete="off"
          autoFocus
          className="w-full px-4 py-2 text-sm bg-white/50 border border-gray-200 rounded-lg outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-[#0070f3]/20 transition-all"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Hourglass className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        )}
      </div>
    </Form>
  );
}
