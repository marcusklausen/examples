"use client";
import React, { use } from "react";
import { ResourceItem, ResourceItemSkeleton } from "./resource-item";
import { getResources } from "src/db/queries/resources";
import { useSearchParams } from "next/navigation";

type Resources = Awaited<ReturnType<typeof getResources>>;

export function ResourceList({
  resourcesPromise,
}: {
  resourcesPromise: Promise<Resources>;
}) {
  const searchParams = useSearchParams();
  const tags = searchParams.get("tags")?.split(",") || "";
  const query = searchParams.get("query") || "";

  const resources = use(resourcesPromise);
  const sortedResources = resources.sort((a, b) => b.votes - a.votes);

  const filterResources = (
    query: string = "",
    selectedTags: string | string[] = "",
    resources: Resources
  ) => {
    return resources.filter((resource) => {
      const isMatchingQuery =
        query === "" ||
        resource.title.toLowerCase().includes(query.toLowerCase()) ||
        resource.note.toString().toLowerCase().includes(query.toLowerCase()) ||
        resource.tags.some((tag) =>
          tag.toLowerCase().includes(query.toLowerCase())
        );

      const isMatchingTag =
        selectedTags === "" ||
        selectedTags === undefined ||
        resource.tags.some((tag) => selectedTags.includes(tag));

      return isMatchingQuery && isMatchingTag;
    });
  };

  return filterResources(query, tags, sortedResources).map((resource) => (
    <ResourceItem key={resource.id} {...resource} />
  ));
}

export const ResourceListSkeleton = () => {
  return (
    <>
      <ResourceItemSkeleton />
      <ResourceItemSkeleton />
      <ResourceItemSkeleton />
    </>
  );
};
