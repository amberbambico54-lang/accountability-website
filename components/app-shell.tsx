"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpenText,
  BriefcaseBusiness,
  CalendarHeart,
  Compass,
  FileText,
  Gem,
  Goal,
  Heart,
  Home,
  LogOut,
  PiggyBank,
  Settings,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { getAuthorBadgeClass } from "@/lib/identity";
import { useWorkspacePages } from "@/components/workspace-pages-provider";

const permanentNavItems = [
  { title: "Dashboard", href: "/", icon: Home },
  { title: "Our Devotion", href: "/devotion", icon: Heart },
  { title: "UpSkill Progress", href: "/lessons", icon: BookOpenText },
  { title: "Business Dump Ideas/Progress", href: "/business", icon: BriefcaseBusiness },
  { title: "Faith Goals (5F's)", href: "/goals", icon: Target },
  { title: "Settings", href: "/settings", icon: Settings },
];

const quickLinks = [
  { title: "Shared vision", href: "/goals", icon: Goal },
  { title: "Daily devotion", href: "/devotion", icon: Sparkles },
  { title: "Progress check", href: "/business", icon: Compass },
  { title: "Family plans", href: "/marriage", icon: Users },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authActionError, setAuthActionError] = useState("");
  const [storageError, setStorageError] = useState("");
  const { user, loading, configured, signOut } = useAuth();
  const { pages, getPageForPath } = useWorkspacePages();
  const optionalNavItems = pages.map((page) => ({
    title: page.title,
    href: page.kind === "custom" ? `/pages/${page.slug}` : `/${page.slug}`,
    icon: page.kind === "wedding" ? CalendarHeart : page.kind === "marriage" ? Gem : page.kind === "budget" ? PiggyBank : FileText,
  }));
  const navItems = [
    ...permanentNavItems.slice(0, -1),
    ...optionalNavItems,
    permanentNavItems[permanentNavItems.length - 1],
  ];

  useEffect(() => {
    if (pathname !== "/login" && !loading && !user) {
      router.replace("/login");
    }
  }, [loading, pathname, router, user]);

  useEffect(() => {
    const handleStorageError = (event: Event) => {
      const message = (event as CustomEvent<unknown>).detail;
      if (typeof message === "string") setStorageError(message);
    };
    window.addEventListener("our-space:storage-error", handleStorageError);
    return () => window.removeEventListener("our-space:storage-error", handleStorageError);
  }, []);

  useEffect(() => {
    const optionalPath = pathname === "/wedding" || pathname === "/marriage" || pathname === "/budget" || pathname.startsWith("/pages/");
    if (optionalPath && !getPageForPath(pathname)) {
      router.replace("/settings");
    }
  }, [getPageForPath, pathname, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-[#71866E]">Loading your private space…</div>;
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-[#71866E]">Taking you to sign in…</div>;
  }

  const handleSignOut = async () => {
    try {
      setAuthActionError("");
      await signOut();
      router.replace("/login");
    } catch (error) {
      setAuthActionError(error instanceof Error ? error.message : "Unable to sign out. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#313B32]">
      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen max-h-screen w-72 shrink-0 flex-col overflow-hidden border-r border-[#E7E0D2] bg-[#FAF7F2] px-5 py-6 lg:flex">
          <div className="mb-5 flex shrink-0 items-center gap-3 rounded-2xl bg-[#313B32] px-3 py-3 text-[#F7F4ED] shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A4B49B] text-sm font-bold text-[#313B32]">
              OS
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#E7E0D2]">Private space</p>
              <h2 className="text-base font-semibold">Our Space</h2>
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#E7E0D2] text-[#313B32] shadow-[0_8px_20px_rgba(49,59,50,0.08)]"
                      : "text-[#5C685F] hover:bg-[#F1EADF] hover:text-[#313B32]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="min-w-0 break-words">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 shrink-0 rounded-3xl border border-[#E7E0D2] bg-white/80 p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#71866E]">Logged in</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#313B32]">{user.name}</p>
                <span className={cn("mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", getAuthorBadgeClass(user.name))}>{user.name}</span>
                {!configured && <p className="mt-1 text-[10px] text-[#8B6AA8]">Temporary demo</p>}
              </div>
              <button type="button" onClick={handleSignOut} aria-label="Sign out" className="rounded-full bg-[#E7E0D2] p-2 text-[#313B32]">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[#E7E0D2] bg-[#F7F4ED]/90 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4 md:px-6 xl:px-8">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-navigation"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E7E0D2] bg-white/80 lg:hidden"
                  onClick={() => setMenuOpen((prev) => !prev)}
                >
                  {menuOpen ? <X className="h-4 w-4" /> : <Compass className="h-4 w-4" />}
                </button>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#71866E]">Our shared home</p>
                  <h1 className="truncate text-base font-semibold text-[#313B32] sm:text-lg">Welcome back, {user.name}</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {quickLinks.slice(0, 2).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="hidden items-center gap-2 rounded-full border border-[#E7E0D2] bg-white/80 px-3 py-1.5 text-xs text-[#313B32] sm:inline-flex"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.title}
                    </Link>
                  );
                })}
                <button type="button" onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-full bg-[#313B32] px-3 py-1.5 text-xs text-[#F7F4ED]">
                  Logout <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </header>

          {menuOpen && (
            <div id="mobile-navigation" className="max-h-[60vh] overflow-y-auto border-b border-[#E7E0D2] bg-[#FAF7F2] p-4 lg:hidden">
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={cn(
                        "flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm",
                        pathname === item.href ? "bg-[#E7E0D2] text-[#313B32]" : "bg-white/80 text-[#5C685F]"
                      )}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 break-words">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <main className="min-w-0 p-3 sm:p-4 md:p-6 xl:p-8">
            {authActionError && <p role="alert" className="mb-4 rounded-2xl border border-[#D9A6A6] bg-[#FBEEEE] p-3 text-sm text-[#8B3F3F]">{authActionError}</p>}
            {storageError && (
              <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-[#D9A6A6] bg-[#FBEEEE] p-3 text-sm text-[#8B3F3F]">
                <p>{storageError}</p>
                <button type="button" aria-label="Dismiss storage warning" onClick={() => setStorageError("")} className="font-semibold">Dismiss</button>
              </div>
            )}
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#5C685F]" aria-label="Topic author color key">
              <span className="font-medium">Topic colors:</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm border-l-4 border-[#5F8F6B] bg-[#EFF6F0]" /> Fernan</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm border-l-4 border-[#8B6AA8] bg-[#F5EFFA]" /> Alpha</span>
            </div>
            {children}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E7E0D2] bg-[#FAF7F2]/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 py-2 sm:gap-2 sm:px-3">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium",
                  active ? "bg-[#E7E0D2] text-[#313B32]" : "text-[#5C685F]"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="leading-none">{item.title.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
