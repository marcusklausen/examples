import { ExternalLink } from "lucide-react";
import { ReactNode } from "react";

export function NavLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const baseClasses =
    "flex items-center gap-2 px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
      >
        {children}
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    );
  }

  return (
    <a href={href} className={baseClasses}>
      {children}
    </a>
  );
}
