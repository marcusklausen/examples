import { ExternalLink, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function WorkItem({
  title,
  description,
  href,
  github,
  tags,
}: {
  title: string;
  description: string;
  href: string;
  github?: string;
  tags: string[];
}) {
  return (
    <div className="relative p-5 rounded-lg border border-gray-100 bg-white/50 hover:bg-white hover:shadow transition-all duration-200 w-full">
      <div className="flex items-center justify-between w-full mb-2">
        <a
          href={href}
          className="group flex items-center justify-between w-full"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className="font-medium text-lg group-hover:text-[#0070f3] transition-colors">
            {title}
          </h2>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#0070f3] transition-colors" />
        </a>
      </div>

      {github && (
        <a
          href={github}
          className="text-gray-400 hover:text-[#0070f3] transition-colors inline-block"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="w-4 h-4" aria-hidden />
        </a>
      )}

      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>

      <div className="flex mt-8 gap-1.5 flex-wrap">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
