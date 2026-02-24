export const docsNavigation = [
  {
    section: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs/intro" },
      { title: "Setup", href: "/docs/setup" },
    ],
  },
  {
    section: "Architecture",
    items: [
      { title: "Models", href: "/docs/models" },
      { title: "Design Principles", href: "/docs/design" }, // Placeholder
    ],
  },
  {
    section: "Usage",
    items: [
      { title: "Dashboard", href: "/docs/dashboard" }, // Placeholder
      { title: "API Reference", href: "/docs/api" }, // Placeholder
    ],
  },
];

export const getNextPage = (currentPath: string) => {
  const flatItems = docsNavigation.flatMap((section) => section.items);
  const index = flatItems.findIndex((item) => item.href === currentPath);
  if (index !== -1 && index < flatItems.length - 1) {
    return flatItems[index + 1];
  }
  return null;
};

export const getPrevPage = (currentPath: string) => {
  const flatItems = docsNavigation.flatMap((section) => section.items);
  const index = flatItems.findIndex((item) => item.href === currentPath);
  if (index > 0) {
    return flatItems[index - 1];
  }
  return null;
};
