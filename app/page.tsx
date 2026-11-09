"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, FileText, Sparkles, Target, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { iconMap, moduleCards, recentMoments, targetWeddingDate, userProfile } from "@/lib/content";
import { daysUntil, formatMoney } from "@/lib/utils";
import { getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";
import { useWorkspacePages } from "@/components/workspace-pages-provider";

const storageKey = "our-space-dashboard-moments";
const targetSaved = 180000;

export default function HomePage() {
  const { pages } = useWorkspacePages();
  const [remainingDays, setRemainingDays] = useState(0);
  const [moments] = useState(() => {
    if (typeof window === "undefined") return recentMoments;
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return recentMoments;
    try {
      return JSON.parse(stored);
    } catch {
      return recentMoments;
    }
  });

  useEffect(() => {
    // This value is intentionally resolved on the client after hydration to avoid prerender warnings.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemainingDays(daysUntil(targetWeddingDate));
    window.localStorage.setItem(storageKey, JSON.stringify(moments));
  }, [moments]);

  const totalSaved = useMemo(() => {
    if (typeof window === "undefined") return 54000;
    const entries = JSON.parse(window.localStorage.getItem("our-space-budget") ?? "[]") as Array<{
      amount?: number;
      type?: string;
    }>;
    const deposits = entries.filter((entry) => entry.type === "Deposit").reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
    const withdrawals = entries.filter((entry) => entry.type !== "Deposit").reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
    return Math.max(0, deposits - withdrawals);
  }, []);

  const lessonProgress = 68;
  const goalProgress = 74;
  const savingsProgress = (totalSaved / targetSaved) * 100;
  const permanentModules = moduleCards.filter((item) => !["/wedding", "/marriage", "/budget"].includes(item.href));
  const optionalModules = pages.map((page) => {
    const source = moduleCards.find((item) => item.href === `/${page.slug}`);
    return {
      title: page.title,
      description: page.description,
      href: page.kind === "custom" ? `/pages/${page.slug}` : `/${page.slug}`,
      icon: source?.icon ?? "FileText",
    };
  });
  const journeyModules = [...permanentModules, ...optionalModules];

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      <section className="overflow-hidden rounded-[30px] border border-[#E7E0D2] bg-[linear-gradient(135deg,#F7F4ED_0%,#E7E0D2_100%)] p-6 shadow-[0_18px_38px_rgba(49,59,50,0.08)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge>Growing together</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#313B32] md:text-5xl">
              Growing Together, One Day at a Time.
            </h1>
            <p className="mt-4 max-w-xl text-base text-[#4E5A52] md:text-lg">
              Our little space for faith, growth, dreams, and the future we&apos;re building together.
            </p>
          </div>

          <div className="rounded-3xl border border-[#D9E0D5] bg-white/70 p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#71866E]">Wedding countdown</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-3xl font-semibold text-[#313B32]">{remainingDays}</span>
              <span className="pb-1 text-sm text-[#71866E]">days left</span>
            </div>
            <p className="mt-2 text-xs text-[#4E5A52]">Target date: October 28, 2027</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#71866E]">Today</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#313B32]">Good morning, {userProfile.name}</h3>
            <p className="mt-2 text-sm text-[#4E5A52]">Keep building the kind of home that feels steady, kind, and alive.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#71866E]">UpSkill Progress</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-3xl font-semibold text-[#313B32]">{lessonProgress}%</span>
              <TrendingUp className="h-5 w-5 text-[#71866E]" />
            </div>
            <Progress value={lessonProgress} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#71866E]">Savings progress</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-3xl font-semibold text-[#313B32]">{Math.round(savingsProgress)}%</span>
              <Sparkles className="h-5 w-5 text-[#71866E]" />
            </div>
            <Progress value={savingsProgress} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#71866E]">Wedding savings</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-3xl font-semibold text-[#313B32]">{formatMoney(totalSaved)}</span>
              <CalendarDays className="h-5 w-5 text-[#71866E]" />
            </div>
            <p className="mt-2 text-sm text-[#4E5A52]">{formatMoney(targetSaved - totalSaved)} remaining to target</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#71866E]">Our journey</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#313B32]">Life, faith, and growth in one place</h2>
          </div>
          <Button asChild variant="secondary">
            <Link href="/goals">
              Explore goals <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {journeyModules.map((item) => {
            const Icon = item.icon === "FileText" ? FileText : iconMap[item.icon] ?? Target;
            return (
              <Link key={item.title} href={item.href}>
                <Card className="h-full transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(49,59,50,0.08)]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7E0D2] text-[#313B32]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge>{item.title.split(" ")[0]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <p className="mt-3 text-sm leading-6 text-[#4E5A52]">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Our Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-[#4E5A52]">
                <span>UpSkill progress</span>
                <span>{goalProgress}%</span>
              </div>
              <Progress value={goalProgress} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-[#4E5A52]">
                <span>Business idea progress</span>
                <span>72%</span>
              </div>
              <Progress value={72} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-[#4E5A52]">
                <span>Annual goals</span>
                <span>74%</span>
              </div>
              <Progress value={74} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-[#4E5A52]">
                <span>Wedding savings</span>
                <span>{Math.round(savingsProgress)}%</span>
              </div>
              <Progress value={savingsProgress} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Our recent moments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {moments.slice(0, 5).map((item: { title: string; time: string; description: string; owner: string; accent: string }) => (
              <div key={`${item.title}-${item.time}`} className={`flex gap-3 rounded-2xl border p-3 ${getAuthorCardClass(item.owner)}`}>
                <div className={`h-10 w-10 rounded-xl ${item.accent}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#313B32]">{item.title}</p>
                    <Badge className={getAuthorBadgeClass(item.owner)}>{item.owner}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[#4E5A52]">{item.description}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[#71866E]">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Shared reflection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-8 text-[#4E5A52]">
              &ldquo;We are learning that steady love is built in the quiet, grateful moments — in prayer, in showing up,
              and in choosing each other with patience and faith every day.&rdquo;
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
