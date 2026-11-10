"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, FileText, Sparkles, Target, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { annualGoals, budgetTransactions, businessProjects, iconMap, lessonTracks, moduleCards, targetWeddingDate, userProfile } from "@/lib/content";
import { daysUntil, formatMoney } from "@/lib/utils";
import { getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";
import { useWorkspacePages } from "@/components/workspace-pages-provider";
import { useLocalStorageJson } from "@/lib/use-local-storage-json";
import { useAuth } from "@/components/auth-provider";

type DataRecord = Record<string, unknown>;
const targetSaved = 180000;

function parseRecords(value: unknown): unknown[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "object" && item !== null) : [];
}

function averageProgress(records: unknown[]) {
  if (!records.length) return 0;
  const total = records.reduce<number>((sum, item) => {
    const record = item as DataRecord;
    const progress = Number(record.progress);
    return sum + (Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0);
  }, 0);
  return Math.round(total / records.length);
}

function getGoalProgress(value: unknown) {
  const goal = value as DataRecord;
  const checklists = Array.isArray(goal.checklists) ? goal.checklists : [];
  const tasks = checklists.flatMap((checklist) => {
    if (typeof checklist !== "object" || checklist === null) return [];
    const items = (checklist as DataRecord).tasks;
    return Array.isArray(items) ? items : [];
  });
  if (tasks.length) {
    const done = tasks.filter((task) => typeof task === "object" && task !== null && (task as DataRecord).done === true).length;
    return Math.round((done / tasks.length) * 100);
  }
  const progress = Number(goal.progress);
  return Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;
}

export default function HomePage() {
  const { user } = useAuth();
  const { pages } = useWorkspacePages();
  const [remainingDays, setRemainingDays] = useState(0);
  const [lessonData] = useLocalStorageJson<unknown[]>("our-space-lesson-tracks", lessonTracks, parseRecords);
  const [businessData] = useLocalStorageJson<unknown[]>("our-space-business-projects", businessProjects, parseRecords);
  const [goalData] = useLocalStorageJson<unknown[]>("our-space-annual-goals", annualGoals, parseRecords);
  const [budgetData] = useLocalStorageJson<unknown[]>("our-space-budget", budgetTransactions, parseRecords);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemainingDays(daysUntil(targetWeddingDate));
  }, []);

  const lessonProgress = averageProgress(lessonData);
  const goalProgress = goalData.length
    ? Math.round(goalData.reduce<number>((total, goal) => total + getGoalProgress(goal), 0) / goalData.length)
    : 0;
  const businessProgress = averageProgress(businessData);
  const deposits = budgetData.reduce<number>((sum, item) => {
    const record = item as DataRecord;
    return record.type === "Deposit" ? sum + (Number(record.amount) || 0) : sum;
  }, 0);
  const withdrawals = budgetData.reduce<number>((sum, item) => {
    const record = item as DataRecord;
    return record.type !== "Deposit" ? sum + (Number(record.amount) || 0) : sum;
  }, 0);
  const totalSaved = Math.max(0, deposits - withdrawals);
  const savingsProgress = Math.min(100, (totalSaved / targetSaved) * 100);
  const focusItems = [
    { label: "UpSkill", record: lessonData[0], accent: "bg-[#A4B49B]/20" },
    { label: "Business", record: businessData[0], accent: "bg-[#71866E]/15" },
    { label: "Faith goal", record: goalData[0], accent: "bg-[#E7E0D2]" },
  ].filter((item) => item.record !== undefined);
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
            <h3 className="mt-3 text-2xl font-semibold text-[#313B32]">Good morning, {user?.name ?? userProfile.name}</h3>
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
            <p className="mt-2 text-sm text-[#4E5A52]">{formatMoney(Math.max(0, targetSaved - totalSaved))} remaining to target</p>
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
                <span>{businessProgress}%</span>
              </div>
              <Progress value={businessProgress} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-[#4E5A52]">
                <span>Annual goals</span>
                <span>{goalProgress}%</span>
              </div>
              <Progress value={goalProgress} />
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
            <CardTitle>Current focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {focusItems.map(({ label, record, accent }) => {
              const details = record as DataRecord;
              const owner = typeof details.owner === "string" ? details.owner : "Shared";
              const progress = Number(details.progress);
              return (
              <div key={label} className={`flex gap-3 rounded-2xl border p-3 ${getAuthorCardClass(owner)}`}>
                <div className={`h-10 w-10 rounded-xl ${accent}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#313B32]">{label}: {typeof details.title === "string" ? details.title : "Untitled"}</p>
                    <Badge className={getAuthorBadgeClass(owner)}>{owner}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[#4E5A52]">{typeof details.description === "string" ? details.description : "Keep making progress at your own pace."}</p>
                  {Number.isFinite(progress) && <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[#71866E]">{Math.round(progress)}% complete</p>}
                </div>
              </div>
              );
            })}
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
