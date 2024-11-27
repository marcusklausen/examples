"use client";

import React, { use, useOptimistic, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { useThrottleRouter } from "src/context/throttle-context";
import { getAllTags } from "@/db/queries/resources";

export default function TagFilter({
  allTagsPromise,
}: {
  allTagsPromise: ReturnType<typeof getAllTags>;
}) {
  const router = useThrottleRouter();
  const [isPending, startTransition] = useTransition();

  const [optimisticTags, addOptimisticTags] = useOptimistic(
    router.getParam("tags"),
    (prevTags, tag: string) => {
      return prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag];
    }
  );

  const allTags = use(allTagsPromise);

  const handleClickTag = (tag: string) => {
    startTransition(() => {
      addOptimisticTags(tag);

      const newTags = optimisticTags.includes(tag)
        ? optimisticTags.filter((t) => t !== tag)
        : [...optimisticTags, tag];

      router.setParam("tags", newTags);
    });
  };

  return (
    <div
      className="flex gap-2 flex-wrap"
      data-pending={isPending ? "" : undefined}
    >
      {allTags.map((tag) => {
        return (
          <Badge
            key={tag}
            variant={optimisticTags.includes(tag) ? "active" : "secondary"}
            onClick={() => handleClickTag(tag)}
            className="cursor-pointer text-sm px-3 py-1 select-none"
          >
            {tag}
          </Badge>
        );
      })}
    </div>
  );
}

export const TagFilterSkeleton = () => {
  return (
    <div className="flex gap-2 flex-wrap h-24">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-12" />
    </div>
  );
};
