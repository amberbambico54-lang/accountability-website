"use client";

import { useEffect, useState } from "react";
import { BookOpenText, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { Progress } from "@/components/ui/progress";
import { devotionEntries } from "@/lib/content";
import { useAuth } from "@/components/auth-provider";
import { getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";

const storageKey = "our-space-devotion-entries";

type DevotionEntry = {
  title: string;
  verse: string;
  owner: string;
  visibility: string;
  summary: string;
  reflection: string;
};

export default function DevotionPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DevotionEntry[]>(() => {
    if (typeof window === "undefined") return devotionEntries;
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return devotionEntries;
    try {
      return JSON.parse(stored);
    } catch {
      return devotionEntries;
    }
  });
  const [title, setTitle] = useState("");
  const [verse, setVerse] = useState("Psalm 119:105");
  const [summary, setSummary] = useState("");
  const [reflection, setReflection] = useState("");
  const [visibility, setVisibility] = useState<"Shared" | "Private">("Shared");
  const [addReflectionOpen, setAddReflectionOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries]);

  const handleAddEntry = () => {
    if (!title.trim() || !reflection.trim()) return;
    if (!user) return;
    const newEntry = {
      title: title.trim(),
      verse: verse.trim() || "Psalm 119:105",
      owner: user.name,
      visibility,
      summary: summary.trim() || "A prayerful reminder worth carrying into today.",
      reflection: reflection.trim(),
    };
    setEntries((current: DevotionEntry[]) => [newEntry, ...current]);
    setTitle("");
    setVerse("Psalm 119:105");
    setSummary("");
    setReflection("");
    setVisibility("Shared");
    setAddReflectionOpen(false);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <section className="flex flex-col gap-5 rounded-[28px] border border-[#E7E0D2] bg-[linear-gradient(135deg,#FAF7F2_0%,#E7E0D2_100%)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge>Shared faith</Badge>
            <h1 className="mt-3 text-3xl font-semibold text-[#313B32]">Our Devotion</h1>
            <p className="mt-2 max-w-2xl text-[#4E5A52]">
              A daily place for prayer, scripture, gratitude, and honest reflection that helps us grow in love and grace.
            </p>
          </div>
        </div>
        <AddItemDialog
          open={addReflectionOpen}
          onOpenChange={setAddReflectionOpen}
          title="Add a reflection"
          description="Record a verse, a short summary, and your reflection or prayer."
          triggerLabel="New reflection"
        >
          <div className="space-y-3">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" aria-label="Reflection title" required className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <input value={verse} onChange={(event) => setVerse(event.target.value)} placeholder="Bible verse or reference" aria-label="Bible verse or reference" className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Short summary" aria-label="Short summary" className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} rows={4} placeholder="Your reflection or prayer" aria-label="Your reflection or prayer" required className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <p className="text-sm text-[#4E5A52]">Saved by <span className="font-semibold">{user?.name ?? "your account"}</span></p>
            <div className="flex items-center justify-between gap-3">
              <select value={visibility} onChange={(event) => setVisibility(event.target.value as "Shared" | "Private")} aria-label="Reflection visibility" className="rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]">
                <option value="Shared">Shared</option>
                <option value="Private">Private</option>
              </select>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setAddReflectionOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleAddEntry}>Save reflection</Button>
              </div>
            </div>
          </div>
        </AddItemDialog>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Daily rhythm</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#4E5A52]">Keep a consistent spiritual habit with small but meaningful check-ins and prayer intentions.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpenText className="h-4 w-4" /> Scripture</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#4E5A52]">Reflect on encouraging verses and record lessons that carry into daily life.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Accountability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#4E5A52]">Private commitments and encouraging check-ins create safety without shame or pressure.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          {entries.map((entry: DevotionEntry) => (
            <Card key={`${entry.title}-${entry.verse}`} className={getAuthorCardClass(entry.owner)}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                <div>
                  <CardTitle>{entry.title}</CardTitle>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#71866E]">{entry.visibility}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge>{entry.verse}</Badge>
                  <Badge className={getAuthorBadgeClass(entry.owner)}>{entry.owner}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-[#4E5A52]">{entry.summary}</p>
                <div className="rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#71866E]">Reflection</p>
                  <p className="mt-2 text-sm leading-6 text-[#313B32]">{entry.reflection}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Private accountability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-[#4E5A52]">
                <span>Consistency</span>
                <span>82%</span>
              </div>
              <Progress value={82} />
            </div>
            <div className="rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-4">
              <p className="text-sm font-medium text-[#313B32]">Current commitment</p>
              <p className="mt-2 text-sm text-[#4E5A52]">Wake early for prayer and avoid heavy distractions before 9am.</p>
            </div>
            <div className="rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-4">
              <p className="text-sm font-medium text-[#313B32]">Encouragement check-in</p>
              <p className="mt-2 text-sm text-[#4E5A52]">We believe in progress, not pressure. Keep tending the small habits that build strength and peace.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
