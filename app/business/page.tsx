"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, CheckCircle2, Lightbulb } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { Progress } from "@/components/ui/progress";
import { businessProjects } from "@/lib/content";
import { useAuth } from "@/components/auth-provider";
import { getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";

const storageKey = "our-space-business-projects";

type BusinessIdea = {
  id: string;
  title: string;
  owner: string;
  description: string;
  progress: number;
  createdBy: string;
};

const toPercent = (value: number) => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

const initialBusinessIdeas: BusinessIdea[] = businessProjects.map((project) => ({
  id: project.id,
  title: project.title,
  owner: project.owner,
  description: project.tasks.map((task) => task.text).join(" "),
  progress: project.progress,
  createdBy: project.owner === "Alpha" ? "Alpha" : "Fernan",
}));

function loadBusinessIdeas(): BusinessIdea[] {
  if (typeof window === "undefined") return initialBusinessIdeas;
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return initialBusinessIdeas;

  try {
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return initialBusinessIdeas;

    return parsed.flatMap((item, index) => {
      if (typeof item !== "object" || item === null) return [];
      const record = item as Record<string, unknown>;
      const title = typeof record.title === "string"
        ? record.title
        : typeof record.name === "string" ? record.name : "Untitled business idea";
      const owner = typeof record.owner === "string" ? record.owner : "Shared";
      const tasks = Array.isArray(record.tasks) ? record.tasks : [];
      const completedTasks = tasks.filter((task) => (
        typeof task === "object" && task !== null && "done" in task && task.done === true
      )).length;
      const legacyProgress = Number(record.progress);
      const progress = Number.isFinite(legacyProgress)
        ? toPercent(legacyProgress)
        : tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
      const legacyDescription = typeof record.description === "string" ? record.description : "";
      const taskDescription = tasks.flatMap((task) => {
        if (typeof task !== "object" || task === null || !("text" in task) || typeof task.text !== "string") return [];
        return [task.text];
      }).join(" ");

      return [{
        id: typeof record.id === "string" ? record.id : `business-idea-${index}`,
        title,
        owner,
        description: legacyDescription || taskDescription || "No description yet.",
        progress,
        createdBy: record.createdBy === "Alpha" || (!record.createdBy && owner === "Alpha") ? "Alpha" : "Fernan",
      }];
    });
  } catch {
    return initialBusinessIdeas;
  }
}

export default function BusinessPage() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<BusinessIdea[]>(initialBusinessIdeas);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState("0");
  const [addIdeaOpen, setAddIdeaOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIdeas(loadBusinessIdeas());
      setStorageLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(ideas));
  }, [ideas, storageLoaded]);

  const handleAddIdea = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !user) return;

    const nextIdea: BusinessIdea = {
      id: `business-idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmedTitle,
      owner: user.name,
      createdBy: user.name,
      description: description.trim() || "No description yet.",
      progress: toPercent(Number(progress) || 0),
    };
    setIdeas((current) => [nextIdea, ...current]);
    setTitle("");
    setDescription("");
    setProgress("0");
    setAddIdeaOpen(false);
  };

  const updateIdeaProgress = (id: string, nextProgress: number) => {
    setIdeas((current) => current.map((idea) => idea.id === id
      ? { ...idea, progress: toPercent(nextProgress) }
      : idea));
  };

  const updateIdeaDescription = (id: string, nextDescription: string) => {
    setIdeas((current) => current.map((idea) => idea.id === id
      ? { ...idea, description: nextDescription }
      : idea));
  };

  const activeIdeas = ideas.filter((idea) => idea.progress > 0 && idea.progress < 100).length;
  const completedIdeas = ideas.filter((idea) => idea.progress === 100).length;

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <section className="flex flex-col gap-5 rounded-[28px] border border-[#E7E0D2] bg-[linear-gradient(135deg,#FAF7F2_0%,#E7E0D2_100%)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Badge>Business</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-[#313B32]">Business Dump Ideas/Progress</h1>
          <p className="mt-2 max-w-2xl text-[#4E5A52]">
            Capture business ideas as they come, add context, and update progress as each idea takes shape.
          </p>
        </div>
        <AddItemDialog
          open={addIdeaOpen}
          onOpenChange={setAddIdeaOpen}
          title="Add business idea"
          description="Capture an idea and set its starting progress."
          triggerLabel="Add business idea"
        >
          <div className="space-y-3">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Idea title" aria-label="Idea title" required className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the business idea or latest progress" aria-label="Idea description" rows={3} className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="flex items-center rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#4E5A52]">Added by {user?.name ?? "your account"}</p>
              <label className="flex items-center gap-2 rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#4E5A52]">
                Progress
                <input type="number" min={0} max={100} value={progress} onChange={(event) => setProgress(event.target.value)} aria-label="Initial progress percentage" className="min-w-0 flex-1 bg-transparent text-right text-[#313B32] outline-none" />
                %
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAddIdeaOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleAddIdea}>Add idea</Button>
            </div>
          </div>
        </AddItemDialog>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Business ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{ideas.length}</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Ideas saved in your shared space</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4" /> In progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{activeIdeas}</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Ideas currently taking shape</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{completedIdeas}</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Ideas brought to completion</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {ideas.map((idea) => (
          <Card key={idea.id} className={getAuthorCardClass(idea.createdBy)}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle>{idea.title}</CardTitle>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#71866E]">{idea.owner} · Business idea</p>
                <Badge className={`mt-2 ${getAuthorBadgeClass(idea.createdBy)}`}>{idea.createdBy}</Badge>
              </div>
              <Badge>{idea.progress}%</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={idea.description}
                onChange={(event) => updateIdeaDescription(idea.id, event.target.value)}
                aria-label={`Description for ${idea.title}`}
                rows={3}
                className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-[#4E5A52]">
                  <span>Progress</span>
                  <span>{idea.progress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={idea.progress}
                  onChange={(event) => updateIdeaProgress(idea.id, Number(event.target.value))}
                  aria-label={`Progress for ${idea.title}`}
                  className="h-2 w-full cursor-pointer accent-[#71866E]"
                />
              </div>
              <Progress value={idea.progress} />
              <div className="flex items-center justify-between text-sm text-[#4E5A52]">
                <span>Idea progress</span>
                <span>{idea.progress}% complete</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
