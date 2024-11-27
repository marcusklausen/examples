import { cn } from "@/utils";

import {
  ResourceList,
  ResourceListSkeleton,
} from "./_components/resource-list";
import { connection } from "next/server";
import { getAllTags, getResources } from "src/db/queries/resources";
import { Suspense } from "react";
import TagFilter, { TagFilterSkeleton } from "../../_components/tag-filter";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const { throttle: throttleParam } = await searchParams;

  const throttleAmount = Array.isArray(throttleParam)
    ? throttleParam[0]
    : throttleParam ?? "0";

  await new Promise((resolve) => setTimeout(resolve, parseInt(throttleAmount)));

  const resourcesPromise = getResources();
  const allTagsPromise = getAllTags();

  return (
    <>
      <div className="mt-5">
        <Suspense fallback={<TagFilterSkeleton />}>
          <TagFilter allTagsPromise={allTagsPromise} />
        </Suspense>
      </div>
      <div
        className={cn(
          "grid gap-4 mt-8",
          "group-has-[[data-pending]]/resources:animate-stale transition-opacity"
        )}
      >
        <Suspense fallback={<ResourceListSkeleton />}>
          <ResourceList resourcesPromise={resourcesPromise} />
        </Suspense>
      </div>
    </>
  );
}
