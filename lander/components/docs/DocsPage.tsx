"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getNextPage, getPrevPage } from "@/lib/docs/navigation";
import { TableOfContents } from "./TableOfContents";

interface TocItem {
  id: string;
  title: string;
}

interface DocsPageProps {
  title: string;
  description?: string;
  toc?: TocItem[];
  children: React.ReactNode;
}

export function DocsPage({ title, description, toc = [], children }: DocsPageProps) {
  const pathname = usePathname();
  const next = getNextPage(pathname);
  const prev = getPrevPage(pathname);

  return (
    <div className="flex xl:gap-12 relative w-full">
      <div className="flex-1 min-w-0 pb-16">
        <div className="mb-8">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-xl text-muted-foreground">{description}</p>
          )}
        </div>
        
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-a:text-blue-600 prose-img:rounded-xl">
          {children}
        </div>

        <hr className="my-10 border-slate-200 dark:border-slate-800" />

        <div className="flex justify-between items-center pt-8">
          {prev ? (
            <Link
              href={prev.href}
              className="group flex flex-col gap-2 rounded-xl border p-6 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors w-full max-w-[48%]"
            >
              <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground">
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Previous
              </div>
              <div className="font-semibold text-lg text-foreground">{prev.title}</div>
            </Link>
          ) : (
            <div />
          )}

          {next && (
            <Link
              href={next.href}
              className="group flex flex-col gap-2 items-end rounded-xl border p-6 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors w-full max-w-[48%] text-right"
            >
              <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground">
                Next
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="font-semibold text-lg text-foreground">{next.title}</div>
            </Link>
          )}
        </div>
      </div>
      
      {toc.length > 0 && <TableOfContents items={toc} />}
    </div>
  );
}
