"use client";

import { useState } from "react";
import { BookOpenText, Pencil, ShieldCheck, Sparkles, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { devotionEntries } from "@/lib/content";
import { useAuth } from "@/components/auth-provider";
import { canManageContent, getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";
import { useLocalStorageJson } from "@/lib/use-local-storage-json";

const storageKey = "our-space-devotion-entries";

type DevotionEntry = {
  id: string;
  title: string;
  verse: string;
  owner: string;
  visibility: string;
  summary: string;
  reflection: string;
};

const initialEntries: DevotionEntry[] = devotionEntries.map((entry, index) => ({ ...entry, id: `devotion-entry-${index}` }));

function parseEntries(value: unknown): DevotionEntry[] {
  if (!Array.isArray(value)) throw new Error("Saved devotion data must be a list.");
  return value.flatMap((item, index) => {
    if (typeof item !== "object" || item === null) return [];
    const entry = item as Partial<DevotionEntry>;
    if (typeof entry.title !== "string" || typeof entry.reflection !== "string") return [];
    return [{
      id: typeof entry.id === "string" ? entry.id : `devotion-entry-${index}`,
      title: entry.title,
      verse: typeof entry.verse === "string" ? entry.verse : "",
      owner: typeof entry.owner === "string" ? entry.owner : "Shared",
      visibility: entry.visibility === "Private" ? "Private" : "Shared",
      summary: typeof entry.summary === "string" ? entry.summary : "",
      reflection: entry.reflection,
    }];
  });
}

export default function DevotionPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useLocalStorageJson(storageKey, initialEntries, parseEntries);
  const [title, setTitle] = useState("");
  const [verse, setVerse] = useState("Psalm 119:105");
  const [summary, setSummary] = useState("");
  const [reflection, setReflection] = useState("");
  const [visibility, setVisibility] = useState<"Shared" | "Private">("Shared");
  const [addReflectionOpen, setAddReflectionOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryEdit, setEntryEdit] = useState<DevotionEntry | null>(null);
  const visibleEntries = entries.filter((entry) => entry.visibility !== "Private" || entry.owner === user?.name);
  const sharedEntryCount = visibleEntries.filter((entry) => entry.visibility !== "Private").length;
  const privateEntryCount = visibleEntries.filter((entry) => entry.visibility === "Private").length;

  const handleAddEntry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !reflection.trim()) return;
    if (!user) return;
    const newEntry = {
      id: `devotion-entry-${Date.now()}`,
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

  const handleSaveEntry = () => {
    if (!canManageContent(entryEdit?.owner, user?.name)) return;
    if (!entryEdit?.title.trim() || !entryEdit.reflection.trim()) return;
    setEntries((current) => current.map((entry) => entry.id === entryEdit.id ? entryEdit : entry));
    setEditingEntryId(null);
    setEntryEdit(null);
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
          <form className="space-y-3" onSubmit={handleAddEntry}>
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
                <Button type="submit">Save reflection</Button>
              </div>
            </div>
          </form>
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
          {visibleEntries.length === 0 && <Card><CardContent className="py-6 text-sm text-[#4E5A52]">No reflections are visible yet. Add one to begin.</CardContent></Card>}
          {visibleEntries.map((entry) => (
            <Card key={entry.id} className={getAuthorCardClass(entry.owner)}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                <div>
                  {editingEntryId === entry.id && entryEdit ? (
                    <input value={entryEdit.title} onChange={(event) => setEntryEdit({ ...entryEdit, title: event.target.value })} aria-label="Edit reflection title" className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                  ) : <CardTitle>{entry.title}</CardTitle>}
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#71866E]">{entry.visibility}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge>{entry.verse}</Badge>
                  <Badge className={getAuthorBadgeClass(entry.owner)}>{entry.owner}</Badge>
                  {!canManageContent(entry.owner, user?.name) && <p className="text-xs text-[#71866E]">Only {entry.owner} can edit or delete this reflection.</p>}
                  {entry.owner === user?.name && (
                    <div className="flex">
                      <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${entry.title}`} onClick={() => {
                        setEditingEntryId(entry.id);
                        setEntryEdit({ ...entry });
                      }}><Pencil className="h-4 w-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${entry.title}`} onClick={() => {
                        if (!canManageContent(entry.owner, user?.name)) return;
                        setEntries((current) => current.filter((item) => item.id !== entry.id));
                      }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {editingEntryId === entry.id && entryEdit ? (
                  <div className="space-y-3">
                    <input value={entryEdit.verse} onChange={(event) => setEntryEdit({ ...entryEdit, verse: event.target.value })} aria-label="Edit Bible verse" className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                    <textarea value={entryEdit.summary} onChange={(event) => setEntryEdit({ ...entryEdit, summary: event.target.value })} aria-label="Edit summary" rows={2} className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                    <textarea value={entryEdit.reflection} onChange={(event) => setEntryEdit({ ...entryEdit, reflection: event.target.value })} aria-label="Edit reflection" rows={4} className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                    <select value={entryEdit.visibility} onChange={(event) => setEntryEdit({ ...entryEdit, visibility: event.target.value })} aria-label="Edit visibility" className="rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm">
                      <option value="Shared">Shared</option><option value="Private">Private</option>
                    </select>
                    <div className="flex gap-2"><Button type="button" size="sm" onClick={handleSaveEntry}>Save changes</Button><Button type="button" size="sm" variant="ghost" onClick={() => { setEditingEntryId(null); setEntryEdit(null); }}>Cancel</Button></div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-6 text-[#4E5A52]">{entry.summary}</p>
                <div className="rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#71866E]">Reflection</p>
                  <p className="mt-2 text-sm leading-6 text-[#313B32]">{entry.reflection}</p>
                </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reflection overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-4">
              <p className="text-2xl font-semibold text-[#313B32]">{visibleEntries.length}</p>
              <p className="mt-1 text-sm text-[#4E5A52]">Reflections visible to you</p>
            </div>
            <p className="text-sm text-[#4E5A52]">Shared: {sharedEntryCount} · Private to this profile in the interface: {privateEntryCount}</p>
            <p className="rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-4 text-sm text-[#4E5A52]">Privacy reminder: reflections are stored in this browser. The private setting hides entries in the app but does not secure them from someone with browser access.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
