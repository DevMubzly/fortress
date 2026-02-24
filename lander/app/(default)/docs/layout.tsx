
import Link from "next/link";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarItems = [
    { title: "Introduction", href: "/docs" },
    { title: "Installation", href: "/docs/installation" },
    { title: "Architecture", href: "/docs/architecture" },
    { title: "Administration", href: "/docs/administration" },
    { title: "Audit & Compliance", href: "/docs/compliance" },
    { title: "Security Protocols", href: "/docs/security" },
    { title: "API Reference", href: "/docs/api" },
  ];

  return (
    <div className="container relative mx-auto flex min-h-screen w-full flex-col px-4 md:px-6">
      <div className="flex flex-1 flex-col py-8 md:grid md:grid-cols-[220px_1fr] md:gap-10 lg:grid-cols-[240px_1fr] lg:py-12">
        <aside className="fixed top-24 z-30 hidden h-[calc(100vh-6rem)] w-full shrink-0 overflow-y-auto border-r border-gray-200 pr-6 md:sticky md:block">
          <div className="flex flex-col gap-2">
            <h4 className="mb-2 rounded-md px-2 py-1 text-sm font-semibold">
              Documentation
            </h4>
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 text-sm font-medium text-gray-500 hover:text-gray-900 hover:underline"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </aside>
        <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
          <div className="mx-auto w-full min-w-0">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
