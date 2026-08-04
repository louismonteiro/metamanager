import Link from "next/link";
import { Activity, LayoutDashboard, MessagesSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { META_API_VERSION } from "@/lib/meta-api";

const LINKS = [
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/health", label: "Health", icon: Activity },
] as const;

export function SiteNav() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          MetaManager
        </Link>

        <ul className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors"
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <Badge variant="outline" className="ml-auto font-mono">
          Marketing API {META_API_VERSION}
        </Badge>
      </nav>
    </header>
  );
}
