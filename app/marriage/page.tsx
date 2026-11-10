"use client";

import { useState } from "react";
import { HeartHandshake, Pencil, Trash2 } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { useWorkspacePages } from "@/components/workspace-pages-provider";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { marriageSections } from "@/lib/content";
import { canManageContent, getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";
import { useLocalStorageJson } from "@/lib/use-local-storage-json";

type MarriageSection = {
  id: string;
  title: string;
  summary: string;
  createdBy: string;
};

const storageKey = "our-space-marriage-plans";
const initialSections: MarriageSection[] = marriageSections.map((section, index) => ({
  ...section,
  id: `marriage-plan-${index}`,
  createdBy: "Fernan",
}));

function parseSections(value: unknown): MarriageSection[] {
  if (!Array.isArray(value)) throw new Error("Saved marriage plan data must be a list.");
  return value.flatMap((item, index) => {
    if (typeof item !== "object" || item === null) return [];
    const section = item as Partial<MarriageSection>;
    if (typeof section.title !== "string" || typeof section.summary !== "string") return [];
    return [{
      id: typeof section.id === "string" ? section.id : `marriage-plan-${index}`,
      title: section.title,
      summary: section.summary,
      createdBy: section.createdBy === "Alpha" ? "Alpha" : "Fernan",
    }];
  });
}

export default function MarriagePage() {
  const { user } = useAuth();
  const { pages } = useWorkspacePages();
  const pageDetails = pages.find((page) => page.kind === "marriage");
  const [sections, setSections] = useLocalStorageJson(storageKey, initialSections, parseSections);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ title: "", summary: "" });

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !summary.trim() || !user) return;
    setSections((current) => [{
      id: `marriage-plan-${Date.now()}`,
      title: title.trim(),
      summary: summary.trim(),
      createdBy: user.name,
    }, ...current]);
    setTitle("");
    setSummary("");
    setAddOpen(false);
  };

  const handleSave = (id: string) => {
    const section = sections.find((item) => item.id === id);
    if (!canManageContent(section?.createdBy, user?.name)) return;
    if (!editDraft.title.trim() || !editDraft.summary.trim()) return;
    setSections((current) => current.map((section) => section.id === id
      ? { ...section, title: editDraft.title.trim(), summary: editDraft.summary.trim() }
      : section));
    setEditingId(null);
  };

  const handleStartEdit = (section: MarriageSection) => {
    if (!canManageContent(section.createdBy, user?.name)) return;
    setEditingId(section.id);
    setEditDraft({ title: section.title, summary: section.summary });
  };

  const handleDelete = (id: string) => {
    const section = sections.find((item) => item.id === id);
    if (!canManageContent(section?.createdBy, user?.name)) return;
    setSections((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <section className="flex flex-col gap-5 rounded-[28px] border border-[#E7E0D2] bg-[linear-gradient(135deg,#FAF7F2_0%,#E7E0D2_100%)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Badge>Future home</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-[#313B32]">{pageDetails?.title ?? "Marriage Plans"}</h1>
          <p className="mt-2 max-w-2xl text-[#4E5A52]">
            {pageDetails?.description ?? "A thoughtful planning space for the life we are preparing to build: support, investment, honesty, and home."}
          </p>
        </div>
        <AddItemDialog open={addOpen} onOpenChange={setAddOpen} title="Add a marriage plan topic" description="Capture a future-home topic and the conversation or plan to remember." triggerLabel="Add topic">
          <form className="space-y-3" onSubmit={handleAdd}>
            <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Topic title" aria-label="Topic title" className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
            <textarea required value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} placeholder="Details" aria-label="Topic details" className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button type="submit">Add topic</Button></div>
          </form>
        </AddItemDialog>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sections.length === 0 && <Card><CardContent className="py-6 text-sm text-[#4E5A52]">No marriage plan topics yet. Add one to start planning.</CardContent></Card>}
        {sections.map((section) => {
          const canManageSection = canManageContent(section.createdBy, user?.name);
          return (
          <Card key={section.id} className={`min-w-0 ${getAuthorCardClass(section.createdBy)}`}>
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="min-w-0 break-words"><HeartHandshake className="h-4 w-4 shrink-0" />{section.title}</CardTitle>
              {canManageSection && <div className="flex shrink-0 self-end">
                <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${section.title}`} onClick={() => handleStartEdit(section)}><Pencil className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${section.title}`} onClick={() => handleDelete(section.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>}
            </CardHeader>
            <CardContent>
              {editingId === section.id && canManageSection ? (
                <div className="space-y-2">
                  <input value={editDraft.title} onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })} aria-label="Edit topic title" className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                  <textarea value={editDraft.summary} onChange={(event) => setEditDraft({ ...editDraft, summary: event.target.value })} aria-label="Edit topic details" rows={4} className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                  <div className="flex gap-2"><Button type="button" size="sm" onClick={() => handleSave(section.id)}>Save</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button></div>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-6 text-[#4E5A52]">{section.summary}</p>
                  <Badge className={`mt-3 ${getAuthorBadgeClass(section.createdBy)}`}>{section.createdBy}</Badge>
                  {!canManageSection && <p className="mt-2 text-xs text-[#71866E]">Only {section.createdBy} can edit or delete this topic.</p>}
                </>
              )}
            </CardContent>
          </Card>
          );
        })}
      </section>
    </div>
  );
}
