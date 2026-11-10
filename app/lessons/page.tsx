"use client";

import { useState } from "react";
import { BookOpenCheck, CheckCircle2, Clock3, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { Progress } from "@/components/ui/progress";
import { lessonTracks } from "@/lib/content";
import { useAuth } from "@/components/auth-provider";
import { canManageContent, getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";
import { useLocalStorageJson } from "@/lib/use-local-storage-json";

const storageKey = "our-space-lesson-tracks";

type LessonTask = {
  id: string;
  text: string;
  done: boolean;
  createdBy: string;
};

type LessonTrack = {
  id: string;
  title: string;
  owner: string;
  description: string;
  progress: number;
  tasks: LessonTask[];
  category: string;
  createdBy: string;
};

const getProgress = (tasks: LessonTask[]) => {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task.done).length / tasks.length) * 100);
};

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const initialLessonTracks: LessonTrack[] = lessonTracks.map((track, index) => {
  const id = `lesson-track-${index}`;
  const createdBy = track.owner === "Alpha" ? "Alpha" : "Fernan";
  return {
    id,
    title: track.title,
    owner: track.owner,
    description: track.description,
    progress: track.progress,
    category: track.category,
    createdBy,
    tasks: [],
  };
});

function normalizeTracks(value: unknown): LessonTrack[] {
  if (!Array.isArray(value)) throw new Error("Saved lesson data must be a list.");

  return value.flatMap((item, index) => {
    if (typeof item !== "object" || item === null) return [];
    const track = item as Record<string, unknown>;
    const title = typeof track.title === "string" ? track.title : "Untitled learning track";
    const owner = typeof track.owner === "string" ? track.owner : "Fernan";
    const createdBy = track.createdBy === "Alpha" || (!track.createdBy && owner === "Alpha") ? "Alpha" : "Fernan";
    const id = typeof track.id === "string" ? track.id : `lesson-track-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    let tasks: LessonTask[];
    let progress = Math.min(100, Math.max(0, Number(track.progress) || 0));

    if (Array.isArray(track.tasks)) {
      tasks = track.tasks.flatMap((itemTask, taskIndex) => {
        if (typeof itemTask !== "object" || itemTask === null) return [];
        const task = itemTask as Record<string, unknown>;
        if (typeof task.text !== "string") return [];
        return [{
          id: typeof task.id === "string" ? task.id : `${id}-task-${taskIndex}`,
          text: task.text,
          done: Boolean(task.done),
          createdBy: task.createdBy === "Alpha" ? "Alpha" : createdBy,
        }];
      });
      const generatedLegacySteps = tasks.length > 0 && tasks.every((task, taskIndex) => (
        task.text === `Learning step ${taskIndex + 1}`
      ));
      if (generatedLegacySteps) {
        progress = getProgress(tasks);
        tasks = [];
      }
    } else {
      const total = Math.max(0, Math.min(100, Math.round(Number(track.total) || 12)));
      const completed = Math.min(total, Math.max(0, Math.round(Number(track.completed) || (progress / 100) * total)));
      progress = Math.min(100, Math.max(0, Number(track.progress) || (total ? Math.round((completed / total) * 100) : 0)));
      tasks = [];
    }

    return [{
      id,
      title,
      owner,
      description: typeof track.description === "string" ? track.description : "No description yet.",
      progress,
      tasks,
      category: typeof track.category === "string" ? track.category : owner === "Shared" ? "Shared" : "Personal",
      createdBy,
    }];
  });
}

export default function LessonsPage() {
  const { user } = useAuth();
  const [tracks, setTracks] = useLocalStorageJson(storageKey, initialLessonTracks, normalizeTracks);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [addTrackOpen, setAddTrackOpen] = useState(false);
  const [addStepTrackId, setAddStepTrackId] = useState<string | null>(null);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editedTrackTitle, setEditedTrackTitle] = useState("");

  const handleAddTrack = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !user) return;

    const nextTrack: LessonTrack = {
      id: createId("lesson-track"),
      title: trimmedTitle,
      owner: user.name,
      createdBy: user.name,
      description: description.trim() || "No description yet.",
      progress: 0,
      tasks: [],
      category: "Personal",
    };
    setTracks((current) => [nextTrack, ...current]);
    setTitle("");
    setDescription("");
    setAddTrackOpen(false);
  };

  const handleAddTask = (event: React.FormEvent<HTMLFormElement>, trackId: string) => {
    event.preventDefault();
    const text = (taskDrafts[trackId] ?? "").trim();
    if (!text || !user) return;
    const track = tracks.find((item) => item.id === trackId);
    if (!track || !canManageContent(track.createdBy, user.name)) return;
    setTracks((current) => current.map((track) => track.id === trackId
      ? {
          ...track,
          progress: track.tasks.length === 0 ? 0 : track.progress,
          tasks: [...track.tasks, { id: createId("lesson-task"), text, done: false, createdBy: user.name }],
        }
      : track));
    setTaskDrafts((current) => ({ ...current, [trackId]: "" }));
    setAddStepTrackId(null);
  };

  const handleToggleTask = (trackId: string, taskId: string) => {
    const track = tracks.find((item) => item.id === trackId);
    if (!canManageContent(track?.createdBy, user?.name)) return;
    setTracks((current) => current.map((track) => track.id === trackId
      ? { ...track, tasks: track.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task) }
      : track));
  };

  const handleDeleteTask = (trackId: string, taskId: string) => {
    const track = tracks.find((item) => item.id === trackId);
    if (!canManageContent(track?.createdBy, user?.name)) return;
    setTracks((current) => current.map((track) => track.id === trackId
      ? { ...track, tasks: track.tasks.filter((task) => task.id !== taskId) }
      : track));
  };

  const handleStartTrackEdit = (track: LessonTrack) => {
    if (!canManageContent(track.createdBy, user?.name)) return;
    setEditingTrackId(track.id);
    setEditedTrackTitle(track.title);
  };

  const handleSaveTrack = (trackId: string) => {
    const track = tracks.find((item) => item.id === trackId);
    if (!canManageContent(track?.createdBy, user?.name) || !editedTrackTitle.trim()) return;
    setTracks((current) => current.map((item) => item.id === trackId
      ? { ...item, title: editedTrackTitle.trim() }
      : item));
    setEditingTrackId(null);
  };

  const handleDeleteTrack = (trackId: string) => {
    const track = tracks.find((item) => item.id === trackId);
    if (!canManageContent(track?.createdBy, user?.name)) return;
    setTracks((current) => current.filter((item) => item.id !== trackId));
    if (editingTrackId === trackId) setEditingTrackId(null);
  };

  const updateTrackDescription = (trackId: string, nextDescription: string) => {
    const track = tracks.find((item) => item.id === trackId);
    if (!canManageContent(track?.createdBy, user?.name)) return;
    setTracks((current) => current.map((track) => track.id === trackId
      ? { ...track, description: nextDescription }
      : track));
  };

  const totalTasks = tracks.reduce((total, track) => total + track.tasks.length, 0);
  const completedTasks = tracks.reduce((total, track) => total + track.tasks.filter((task) => task.done).length, 0);

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <section className="flex flex-col gap-5 rounded-[28px] border border-[#E7E0D2] bg-[linear-gradient(135deg,#FAF7F2_0%,#E7E0D2_100%)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Badge>Growth</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-[#313B32]">UpSkill Progress</h1>
          <p className="mt-2 max-w-2xl text-[#4E5A52]">
            Track what each of us is learning, organize it into practical steps, and celebrate progress as we go.
          </p>
        </div>
        <AddItemDialog
          open={addTrackOpen}
          onOpenChange={setAddTrackOpen}
          title="Add learning track"
          description="Create a track and start adding learning steps."
          triggerLabel="Add learning track"
        >
          <form onSubmit={handleAddTrack} className="space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Track title"
              aria-label="Track title"
              required
              className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what you are learning"
              aria-label="Track description"
              rows={3}
              className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
            />
            <p className="text-sm text-[#4E5A52]">Added by {user?.name ?? "your account"}</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAddTrackOpen(false)}>Cancel</Button>
              <Button type="submit">Add track</Button>
            </div>
          </form>
        </AddItemDialog>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpenCheck className="h-4 w-4" /> Learning tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{tracks.length}</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Skills and subjects we are developing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> Checklist steps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{totalTasks}</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Learning steps across all tracks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Completed steps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{completedTasks}</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Milestones achieved</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {tracks.map((track) => {
          const progress = track.tasks.length ? getProgress(track.tasks) : track.progress;
          const canManageTrack = canManageContent(track.createdBy, user?.name);
          return (
            <Card key={track.id} className={getAuthorCardClass(track.createdBy)}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                <div>
                  {editingTrackId === track.id && canManageTrack ? (
                    <div className="flex flex-wrap gap-2">
                      <input value={editedTrackTitle} onChange={(event) => setEditedTrackTitle(event.target.value)} aria-label="Learning track title" className="min-w-0 flex-1 rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-base font-semibold text-[#313B32]" />
                      <Button type="button" size="sm" onClick={() => handleSaveTrack(track.id)}>Save</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingTrackId(null)}>Cancel</Button>
                    </div>
                  ) : <CardTitle>{track.title}</CardTitle>}
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#71866E]">{track.owner} · {track.category}</p>
                  <Badge className={`mt-2 ${getAuthorBadgeClass(track.createdBy)}`}>{track.createdBy}</Badge>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge>{progress}%</Badge>
                  {canManageTrack ? (
                    <div className="flex">
                      <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${track.title}`} onClick={() => handleStartTrackEdit(track)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${track.title}`} onClick={() => handleDeleteTrack(track.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={track.description}
                  onChange={(event) => updateTrackDescription(track.id, event.target.value)}
                  readOnly={!canManageTrack}
                  aria-label={`Description for ${track.title}`}
                  rows={3}
                  className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                />
                <Progress value={progress} />
                <div className="space-y-2 rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#71866E]">Checklist</p>
                  {track.tasks.length === 0 ? (
                    <p className="mt-2 text-sm text-[#4E5A52]">No steps yet. Add the first thing you want to learn or complete.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {track.tasks.map((task) => (
                        <li key={task.id} className="flex items-start gap-3 rounded-xl bg-white/70 px-2 py-2">
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => handleToggleTask(track.id, task.id)}
                            disabled={!canManageTrack}
                            aria-label={`Mark ${task.text} ${task.done ? "incomplete" : "complete"}`}
                            className="mt-1 h-4 w-4 accent-[#71866E]"
                          />
                          <span className={task.done ? "min-w-0 flex-1 text-[#71866E] line-through" : "min-w-0 flex-1 text-[#313B32]"}>{task.text}</span>
                          <Badge className={getAuthorBadgeClass(task.createdBy)}>{task.createdBy}</Badge>
                          {canManageTrack && (
                            <Button type="button" size="icon" variant="ghost" aria-label={`Delete task ${task.text}`} onClick={() => handleDeleteTask(track.id, task.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {canManageTrack ? (
                    <AddItemDialog
                      open={addStepTrackId === track.id}
                      onOpenChange={(open) => setAddStepTrackId(open ? track.id : null)}
                      title="Add a learning step"
                      description={`Add a checklist item to ${track.title}.`}
                      triggerLabel="Add a learning step"
                    >
                      <form className="space-y-3" onSubmit={(event) => handleAddTask(event, track.id)}>
                        <input
                          value={taskDrafts[track.id] ?? ""}
                          onChange={(event) => setTaskDrafts((current) => ({ ...current, [track.id]: event.target.value }))}
                          placeholder="Learning step"
                          aria-label={`Add step to ${track.title}`}
                          required
                          className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" onClick={() => setAddStepTrackId(null)}>Cancel</Button>
                          <Button type="submit">Add step</Button>
                        </div>
                      </form>
                    </AddItemDialog>
                  ) : (
                    <p className="text-sm text-[#71866E]">Only {track.createdBy} can edit this track or add learning steps.</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-[#4E5A52]">
                    <span>{track.tasks.filter((task) => task.done).length} of {track.tasks.length} steps completed</span>
                    <span>{progress}% complete</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
