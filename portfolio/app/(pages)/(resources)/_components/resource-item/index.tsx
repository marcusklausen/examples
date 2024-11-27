import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Votes from "./votes";

interface ResourceLinkProps {
  href: string;
  title: string;
  note?: JSX.Element | string;
  tags?: string[];
  votes: number;
  id: number;
}

export const ResourceItem = ({
  href,
  title,
  note,
  tags,
  votes,
  id: resourceId,
}: ResourceLinkProps) => {
  return (
    <div className=" relative p-5 rounded-lg border border-gray-100 bg-white/50 hover:bg-white hover:shadow-[0_0_1px_rgba(0,0,0,0.3)] transition-all duration-200">
      <div className="flex gap-4">
        <Votes votes={votes} resourceId={resourceId} />
        <a
          href={href}
          className="block space-y-4 flex-1 group"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-medium text-lg group-hover:text-[#0070f3] transition-colors">
              {title}
            </h2>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#0070f3] transition-colors" />
          </div>
          {note && (
            <p
              className="text-gray-600 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: note }}
            />
          )}
          {tags && (
            <div className="flex mt-8 gap-1.5 flex-wrap">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </a>
      </div>
    </div>
  );
};

export const ResourceItemSkeleton = () => {
  return (
    <div className="relative p-5 rounded-lg border border-gray-100 bg-white/50">
      <div className="block space-y-4">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-7 w-[200px]" />
          <Skeleton className="w-4 h-4" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex mt-8 gap-1.5 flex-wrap">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
      </div>
    </div>
  );
};
