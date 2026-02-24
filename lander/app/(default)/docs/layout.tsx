"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const sidebarItems = [
    { title: "Introduction", href: "/docs/intro" },
    { title: "Installation", href: "/docs/installation" },
    { title: "Architecture", href: "/docs/architecture" },
    { title: "Administration", href: "/docs/administration" },
    { title: "Audit & Compliance", href: "/docs/compliance" },
    { title: "Security Protocols", href: "/docs/security" },
    { title: "API Reference", href: "/docs/api" },
  ];

  return (
    <div className="w-full relative flex min-h-screen flex-col px-4 md:px-8">
      <div className="flex flex-1 flex-col py-8 md:grid md:grid-cols-[250px_1fr] md:gap-8 lg:py-10">
        <aside className="fixed top-24 pt-8 z-30 hidden h-[calc(100vh-6rem)] w-[250px] shrink-0 overflow-y-auto border-r border-gray-200 pr-4 md:sticky md:block">
          <DocsSearch />
          <div className="flex flex-col gap-2 pt-4">
            <h4 className="mb-2 rounded-md px-2 py-1 text-sm font-semibold font-persis">
              Documentation
            </h4>
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 text-sm font-medium transition-colors hover:text-foreground",
                  pathname === item.href || (item.href === "/docs/intro" && pathname === "/docs")
                    ? "font-semibold text-foreground bg-muted"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </aside>
        <main className="relative py-16 lg:py-24">
          <div className="mx-auto w-full min-w-0 px-4 md:px-8 lg:px-12 xl:px-16">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
