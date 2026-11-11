"use client";

import { useState } from "react";
import { BriefcaseBusiness, CheckCircle2, Lightbulb, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { Progress } from "@/components/ui/progress";
import { businessProjects } from "@/lib/content";
import { useAuth } from "@/components/auth-provider";
import { canManageContent, getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";
import { useLocalStorageJson } from "@/lib/use-local-storage-json";

const storageKey = "our-space-business-projects";

type BusinessIdea = {
  id: string;
  title: string;
  owner: string;
  description: string;
  progress: number;
  createdBy: string;
  tasks: BusinessTask[];
};

type BusinessTask = {
  id: string;
  text: string;
  done: boolean;
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
  tasks: [],
}));

function normalizeBusinessIdeas(value: unknown): BusinessIdea[] {
  if (!Array.isArray(value)) throw new Error("Saved business data must be a list.");

  return value.flatMap((item, index) => {
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
    const createdBy = record.createdBy === "Alpha" || (!record.createdBy && owner === "Alpha") ? "Alpha" : "Fernan";
    const normalizedTasks: BusinessTask[] = tasks.flatMap((task, taskIndex) => {
      if (typeof task !== "object" || task === null) return [];
      const taskRecord = task as Record<string, unknown>;
      if (typeof taskRecord.text !== "string") return [];
      return [{
        id: typeof taskRecord.id === "string" ? taskRecord.id : `business-idea-${index}-task-${taskIndex}`,
        text: taskRecord.text,
        done: taskRecord.done === true,
        createdBy: taskRecord.createdBy === "Alpha" ? "Alpha" : createdBy,
      }];
    });

    return [{
      id: typeof record.id === "string" ? record.id : `business-idea-${index}`,
      title,
      owner,
      description: legacyDescription || taskDescription || "No description yet.",
      progress,
      createdBy,
      tasks: normalizedTasks,
    }];
  });
}

export default function BusinessPage() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useLocalStorageJson(storageKey, initialBusinessIdeas, normalizeBusinessIdeas);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState("0");
  const [addIdeaOpen, setAddIdeaOpen] = useState(false);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [addTaskIdeaId, setAddTaskIdeaId] = useState<string | null>(null);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});

  const handleAddIdea = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !user) return;

    const nextIdea: BusinessIdea = {
      id: `business-idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmedTitle,
      owner: user.name,
      createdBy: user.name,
      description: description.trim() || "No description yet.",
      progress: toPercent(Number(progress) || 0),
      tasks: [],
    };
    setIdeas((current) => [nextIdea, ...current]);
    setTitle("");
    setDescription("");
    setProgress("0");
    setAddIdeaOpen(false);
  };

  const updateIdeaProgress = (id: string, nextProgress: number) => {
    const idea = ideas.find((item) => item.id === id);
    if (!canManageContent(idea?.createdBy, user?.name)) return;
    setIdeas((current) => current.map((idea) => idea.id === id
      ? { ...idea, progress: toPercent(nextProgress) }
      : idea));
  };

  const updateIdeaDescription = (id: string, nextDescription: string) => {
    const idea = ideas.find((item) => item.id === id);
    if (!canManageContent(idea?.createdBy, user?.name)) return;
    setIdeas((current) => current.map((idea) => idea.id === id
      ? { ...idea, description: nextDescription }
      : idea));
  };

  const handleAddTask = (event: React.FormEvent<HTMLFormElement>, idea: BusinessIdea) => {
    event.preventDefault();
    const text = (taskDrafts[idea.id] ?? "").trim();
    if (!text || !user) return;
    if (!canManageContent(idea.createdBy, user.name)) return;
    const task: BusinessTask = {
      id: `business-task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      done: false,
      createdBy: user.name,
    };
    setIdeas((current) => current.map((item) => item.id === idea.id
      ? { ...item, tasks: [...item.tasks, task] }
      : item));
    setTaskDrafts((current) => ({ ...current, [idea.id]: "" }));
    setAddTaskIdeaId(null);
  };

  const handleToggleTask = (ideaId: string, taskId: string) => {
    const idea = ideas.find((item) => item.id === ideaId);
    if (!canManageContent(idea?.createdBy, user?.name)) return;
    setIdeas((current) => current.map((idea) => idea.id === ideaId
      ? { ...idea, tasks: idea.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task) }
      : idea));
  };

  const handleDeleteTask = (ideaId: string, taskId: string) => {
    const idea = ideas.find((item) => item.id === ideaId);
    if (!canManageContent(idea?.createdBy, user?.name)) return;
    setIdeas((current) => current.map((idea) => idea.id === ideaId
      ? { ...idea, tasks: idea.tasks.filter((task) => task.id !== taskId) }
      : idea));
  };

  const handleStartEditing = (idea: BusinessIdea) => {
    if (!canManageContent(idea.createdBy, user?.name)) return;
    setEditingIdeaId(idea.id);
    setEditedTitle(idea.title);
  };

  const handleSaveTitle = (ideaId: string) => {
    const idea = ideas.find((item) => item.id === ideaId);
    if (!canManageContent(idea?.createdBy, user?.name)) return;
    const trimmedTitle = editedTitle.trim();
    if (!trimmedTitle) return;
    setIdeas((current) => current.map((idea) => idea.id === ideaId
      ? { ...idea, title: trimmedTitle }
      : idea));
    setEditingIdeaId(null);
  };

  const handleDeleteIdea = (idea: BusinessIdea) => {
    if (!canManageContent(idea.createdBy, user?.name)) return;
    setIdeas((current) => current.filter((item) => item.id !== idea.id));
    if (editingIdeaId === idea.id) setEditingIdeaId(null);
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
          <form className="space-y-3" onSubmit={handleAddIdea}>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Idea title" aria-label="Idea title" required className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the business idea or latest progress" aria-label="Idea description" rows={3} className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="flex items-center rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#4E5A52]">Added by {user?.name ?? "your account"}</p>
              <label className="flex items-center gap-2 rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#4E5A52]">
                Progress
                <input type="number" min={0} max={100} step={1} value={progress} onChange={(event) => setProgress(event.target.value)} aria-label="Initial progress percentage" className="min-w-0 flex-1 bg-transparent text-right text-[#313B32] outline-none" />
                %
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAddIdeaOpen(false)}>Cancel</Button>
              <Button type="submit">Add idea</Button>
            </div>
          </form>
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
        {ideas.length === 0 && (
          <Card className="xl:col-span-2">
            <CardContent className="py-8 text-center text-sm text-[#4E5A52]">
              No business ideas yet. Add one to start building your list.
            </CardContent>
          </Card>
        )}
        {ideas.map((idea) => {
          const canManageIdea = canManageContent(idea.createdBy, user?.name);
          return (
          <Card key={idea.id} className={`min-w-0 ${getAuthorCardClass(idea.createdBy)}`}>
            <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 w-full flex-1">
                {editingIdeaId === idea.id && canManageIdea ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={editedTitle}
                      onChange={(event) => setEditedTitle(event.target.value)}
                      aria-label={`Edit title for ${idea.title}`}
                      className="min-w-0 flex-1 rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-base font-semibold text-[#313B32] outline-none focus:border-[#71866E]"
                    />
                    <Button type="button" size="sm" onClick={() => handleSaveTitle(idea.id)}>Save</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditingIdeaId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <CardTitle className="break-words">{idea.title}</CardTitle>
                )}
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#71866E]">{idea.owner} · Business idea</p>
                <Badge className={`mt-2 ${getAuthorBadgeClass(idea.createdBy)}`}>{idea.createdBy}</Badge>
                {!canManageIdea && <p className="mt-1 text-xs text-[#71866E]">Only {idea.createdBy} can edit or delete this idea.</p>}
              </div>
              <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-end">
                <Badge>{idea.progress}%</Badge>
                {canManageIdea && editingIdeaId !== idea.id && (
                  <div className="flex">
                    <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${idea.title}`} onClick={() => handleStartEditing(idea)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDeleteButton itemName={idea.title} ariaLabel={`Delete ${idea.title}`} onConfirm={() => handleDeleteIdea(idea)} />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={idea.description}
                onChange={(event) => updateIdeaDescription(idea.id, event.target.value)}
                readOnly={!canManageIdea}
                aria-label={`Description for ${idea.title}`}
                rows={3}
                className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
              />
              {canManageIdea ? <label className="block space-y-2 text-sm text-[#4E5A52]">
                <span className="flex items-center justify-between">
                  <span>Update progress</span>
                  <span>{idea.progress}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={idea.progress}
                  onChange={(event) => updateIdeaProgress(idea.id, Number(event.target.value))}
                  aria-label={`Progress for ${idea.title}`}
                  className="h-2 w-full cursor-pointer accent-[#71866E]"
                />
              </label> : <p className="text-sm text-[#71866E]">Only {idea.createdBy} can edit this idea and its progress.</p>}
              <Progress value={idea.progress} />
              <div className="space-y-2 rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#71866E]">Checklist</p>
                {idea.tasks.length === 0 ? (
                  <p className="text-sm text-[#4E5A52]">No tasks yet. Add the first step for this idea.</p>
                ) : (
                  <ul className="space-y-2">
                    {idea.tasks.map((task) => (
                      <li key={task.id} className="flex items-start gap-3 rounded-xl bg-white/70 px-2 py-2">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => handleToggleTask(idea.id, task.id)}
                          disabled={!canManageIdea}
                          aria-label={`Mark ${task.text} ${task.done ? "incomplete" : "complete"}`}
                          className="mt-1 h-4 w-4 accent-[#71866E]"
                        />
                        <span className={task.done ? "min-w-0 flex-1 text-[#71866E] line-through" : "min-w-0 flex-1 text-[#313B32]"}>{task.text}</span>
                        <Badge className={getAuthorBadgeClass(task.createdBy)}>{task.createdBy}</Badge>
                        {canManageIdea && (
                          <ConfirmDeleteButton itemName={task.text} ariaLabel={`Delete task ${task.text}`} onConfirm={() => handleDeleteTask(idea.id, task.id)} />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {canManageIdea ? <AddItemDialog
                  open={addTaskIdeaId === idea.id}
                  onOpenChange={(open) => setAddTaskIdeaId(open ? idea.id : null)}
                  title="Add a business idea checklist task"
                  description={`Add a step to ${idea.title}.`}
                  triggerLabel="Add a task"
                >
                  <form className="space-y-3" onSubmit={(event) => handleAddTask(event, idea)}>
                    <input
                      value={taskDrafts[idea.id] ?? ""}
                      onChange={(event) => setTaskDrafts((current) => ({ ...current, [idea.id]: event.target.value }))}
                      placeholder="Checklist task"
                      aria-label={`Add task to ${idea.title}`}
                      required
                      className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setAddTaskIdeaId(null)}>Cancel</Button>
                      <Button type="submit">Add task</Button>
                    </div>
                  </form>
                </AddItemDialog> : null}
                {idea.tasks.length > 0 && (
                  <div className="flex items-center justify-between text-sm text-[#4E5A52]">
                    <span>{idea.tasks.filter((task) => task.done).length} of {idea.tasks.length} tasks completed</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </section>
    </div>
  );
}
