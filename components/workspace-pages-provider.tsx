"use client";

import { createContext, useContext } from "react";
import { useLocalStorageJson } from "@/lib/use-local-storage-json";

export type WorkspacePage = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: "wedding" | "marriage" | "budget" | "custom";
};

const storageKey = "our-space-workspace-pages";

const defaultPages: WorkspacePage[] = [
  {
    id: "wedding",
    slug: "wedding",
    title: "Wedding Planning",
    description: "A calm, beautiful place for inspiration, vendor notes, timeline decisions, and shared ceremony dreams.",
    kind: "wedding",
  },
  {
    id: "marriage",
    slug: "marriage",
    title: "Marriage Plans",
    description: "A thoughtful planning space for the life we are preparing to build: support, investment, honesty, and home.",
    kind: "marriage",
  },
  {
    id: "budget",
    slug: "budget",
    title: "Wedding Budget Piggy Bank",
    description: "A durable savings tracker for the wedding, built with clarity, exact totals, and a shared ledger for both of us.",
    kind: "budget",
  },
];

type WorkspacePagesContextValue = {
  pages: WorkspacePage[];
  addPage: (title: string, description: string) => WorkspacePage;
  updatePage: (id: string, title: string, description: string) => void;
  deletePage: (id: string) => void;
  getPageForPath: (pathname: string) => WorkspacePage | undefined;
};

const WorkspacePagesContext = createContext<WorkspacePagesContextValue | null>(null);

function normalizePages(value: unknown): WorkspacePage[] | null {
  if (!Array.isArray(value)) return null;

  const allowedKinds = new Set(["wedding", "marriage", "budget", "custom"]);
  return value.filter((page): page is WorkspacePage => (
    typeof page === "object"
    && page !== null
    && typeof page.id === "string"
    && typeof page.slug === "string"
    && typeof page.title === "string"
    && typeof page.description === "string"
    && allowedKinds.has(page.kind)
  ));
}

function createSlug(title: string, pages: WorkspacePage[]) {
  const baseSlug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "new-page";
  const reservedSlugs = new Set(["", "login", "settings", "devotion", "lessons", "business", "goals"]);
  let slug = baseSlug;
  let suffix = 2;
  while (reservedSlugs.has(slug) || pages.some((page) => page.slug === slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function parsePages(value: unknown): WorkspacePage[] {
  const pages = normalizePages(value);
  if (!pages) throw new Error("Saved page data must be a list.");
  return pages;
}

export function WorkspacePagesProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [pages, setPages] = useLocalStorageJson(storageKey, defaultPages, parsePages);

  const addPage = (title: string, description: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new Error("Page title is required.");

    const slug = createSlug(trimmedTitle, pages);
    const nextPage: WorkspacePage = {
      id: `custom-${slug}`,
      slug,
      title: trimmedTitle,
      description: description.trim(),
      kind: "custom",
    };
    setPages((current) => [...current, nextPage]);
    return nextPage;
  };

  const updatePage = (id: string, title: string, description: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new Error("Page title is required.");
    setPages((current) => current.map((page) => page.id === id
      ? { ...page, title: trimmedTitle, description: description.trim() }
      : page));
  };

  const deletePage = (id: string) => {
    setPages((current) => current.filter((page) => page.id !== id));
  };

  const getPageForPath = (pathname: string) => pages.find((page) => (
    page.kind === "custom" ? pathname === `/pages/${page.slug}` : pathname === `/${page.slug}`
  ));

  return (
    <WorkspacePagesContext.Provider value={{ pages, addPage, updatePage, deletePage, getPageForPath }}>
      {children}
    </WorkspacePagesContext.Provider>
  );
}

export function useWorkspacePages() {
  const context = useContext(WorkspacePagesContext);
  if (!context) throw new Error("useWorkspacePages must be used within WorkspacePagesProvider.");
  return context;
}
