"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CalendarHeart, Camera, Gift, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { Progress } from "@/components/ui/progress";
import { weddingMoodBoard, weddingProjects, wishListItems } from "@/lib/content";
import { useAuth } from "@/components/auth-provider";
import { getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";
import { useWorkspacePages } from "@/components/workspace-pages-provider";

const storageKey = "our-space-wedding-board";
const projectsStorageKey = "our-space-wedding-projects";

type MoodBoardItem = {
  id: string;
  title: string;
  note: string;
  image: string;
  createdBy: string;
};

type WeddingTask = {
  id: string;
  text: string;
  done: boolean;
  createdBy: string;
};

type WeddingProject = {
  id: string;
  title: string;
  due: string;
  tasks: WeddingTask[];
  createdBy: string;
};

const getProgress = (tasks: WeddingTask[]) => (
  tasks.length ? Math.round((tasks.filter((task) => task.done).length / tasks.length) * 100) : 0
);

const createUniqueId = (prefix: string, existingIds: string[]) => {
  let index = existingIds.length;
  let id = `${prefix}-${index}`;
  while (existingIds.includes(id)) {
    index += 1;
    id = `${prefix}-${index}`;
  }
  return id;
};

const initialMoodBoard: MoodBoardItem[] = weddingMoodBoard.map((item, index) => ({
  ...item,
  id: `wedding-mood-${index}`,
  createdBy: "Fernan",
}));

const initialWeddingProjects: WeddingProject[] = weddingProjects.map((project) => ({
  ...project,
  createdBy: "Fernan",
  tasks: project.tasks.map((task) => ({ ...task, createdBy: "Fernan" })),
}));

export default function WeddingPage() {
  const { user } = useAuth();
  const { pages } = useWorkspacePages();
  const pageDetails = pages.find((page) => page.kind === "wedding");
  const [board, setBoard] = useState<MoodBoardItem[]>(() => {
    if (typeof window === "undefined") return initialMoodBoard;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return initialMoodBoard;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return initialMoodBoard;
      return parsed.map((item: Partial<MoodBoardItem>, index: number) => ({
        id: item.id ?? `wedding-mood-${index}`,
        title: item.title ?? "Wedding inspiration",
        note: item.note ?? "",
        image: item.image ?? "",
        createdBy: item.createdBy === "Alpha" ? "Alpha" : "Fernan",
      }));
    } catch {
      return initialMoodBoard;
    }
  });
  const [projects, setProjects] = useState<WeddingProject[]>(() => {
    if (typeof window === "undefined") return initialWeddingProjects;
    const saved = window.localStorage.getItem(projectsStorageKey);
    if (!saved) return initialWeddingProjects;

    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return initialWeddingProjects;

      return parsed.map((project: Partial<WeddingProject>, index: number) => ({
        id: project.id ?? `wedding-project-${index}`,
        title: project.title ?? "Untitled plan",
        due: project.due ?? "TBD",
        createdBy: project.createdBy === "Alpha" ? "Alpha" : "Fernan",
        tasks: Array.isArray(project.tasks)
          ? project.tasks.map((task: Partial<WeddingTask>, taskIndex: number) => ({
              id: task.id ?? `wedding-project-${index}-task-${taskIndex}`,
              text: task.text ?? "New task",
              done: Boolean(task.done),
              createdBy: task.createdBy === "Alpha" ? "Alpha" : "Fernan",
            }))
          : [],
      }));
    } catch {
      return initialWeddingProjects;
    }
  });
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [image, setImage] = useState<string>("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDue, setProjectDue] = useState("TBD");
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addMoodOpen, setAddMoodOpen] = useState(false);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [addTaskProjectId, setAddTaskProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectEdit, setProjectEdit] = useState({ title: "", due: "" });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskEditText, setTaskEditText] = useState("");
  const [editingMoodId, setEditingMoodId] = useState<string | null>(null);
  const [moodEdit, setMoodEdit] = useState({ title: "", note: "", image: "" });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(board));
  }, [board]);

  useEffect(() => {
    window.localStorage.setItem(projectsStorageKey, JSON.stringify(projects));
  }, [projects]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImage(previewUrl);
  };

  const handleAddMood = () => {
    if (!title.trim()) return;
    if (!user) return;
    const nextItem = {
      id: createUniqueId("wedding-mood", board.map((item) => item.id)),
      title: title.trim(),
      note: note.trim() || "A new inspiration we want to remember.",
      image: image || "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80",
      createdBy: user.name,
    };
    setBoard((current: MoodBoardItem[]) => [nextItem, ...current]);
    setTitle("");
    setNote("");
    setImage("");
    setAddMoodOpen(false);
  };

  const handleStartMoodEdit = (item: MoodBoardItem) => {
    setEditingMoodId(item.id);
    setMoodEdit({ title: item.title, note: item.note, image: item.image });
  };

  const handleMoodEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMoodEdit((current) => ({ ...current, image: URL.createObjectURL(file) }));
  };

  const handleSaveMoodEdit = (itemId: string) => {
    if (!moodEdit.title.trim()) return;

    setBoard((current) => current.map((item) => item.id === itemId
      ? { ...item, title: moodEdit.title.trim(), note: moodEdit.note.trim(), image: moodEdit.image }
      : item));
    setEditingMoodId(null);
  };

  const handleDeleteMood = (itemId: string) => {
    setBoard((current) => current.filter((item) => item.id !== itemId));
    if (editingMoodId === itemId) setEditingMoodId(null);
  };

  const handleAddProject = () => {
    if (!projectTitle.trim()) return;
    if (!user) return;

    const nextProject: WeddingProject = {
      id: createUniqueId("wedding-project", projects.map((project) => project.id)),
      title: projectTitle.trim(),
      due: projectDue.trim() || "TBD",
      tasks: [],
      createdBy: user.name,
    };
    setProjects((current) => [nextProject, ...current]);
    setProjectTitle("");
    setProjectDue("TBD");
    setAddProjectOpen(false);
  };

  const handleAddTask = (projectId: string) => {
    const taskText = (taskDrafts[projectId] ?? "").trim();
    if (!taskText) return;
    if (!user) return;

    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    const taskId = createUniqueId(`${projectId}-task`, project.tasks.map((task) => task.id));

    setProjects((current) => current.map((project) => project.id === projectId
      ? { ...project, tasks: [...project.tasks, { id: taskId, text: taskText, done: false, createdBy: user.name }] }
      : project));
    setTaskDrafts((current) => ({ ...current, [projectId]: "" }));
    setAddTaskProjectId(null);
  };

  const handleTaskToggle = (projectId: string, taskId: string) => {
    setProjects((current) => current.map((project) => project.id === projectId
      ? { ...project, tasks: project.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task) }
      : project));
  };

  const handleStartProjectEdit = (project: WeddingProject) => {
    setEditingProjectId(project.id);
    setProjectEdit({ title: project.title, due: project.due });
  };

  const handleSaveProjectEdit = (projectId: string) => {
    if (!projectEdit.title.trim()) return;

    setProjects((current) => current.map((project) => project.id === projectId
      ? { ...project, title: projectEdit.title.trim(), due: projectEdit.due.trim() || "TBD" }
      : project));
    setEditingProjectId(null);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((current) => current.filter((project) => project.id !== projectId));
    if (editingProjectId === projectId) setEditingProjectId(null);
  };

  const handleStartTaskEdit = (task: WeddingTask) => {
    setEditingTaskId(task.id);
    setTaskEditText(task.text);
  };

  const handleSaveTaskEdit = (projectId: string, taskId: string) => {
    if (!taskEditText.trim()) return;

    setProjects((current) => current.map((project) => project.id === projectId
      ? {
          ...project,
          tasks: project.tasks.map((task) => task.id === taskId ? { ...task, text: taskEditText.trim() } : task),
        }
      : project));
    setEditingTaskId(null);
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    setProjects((current) => current.map((project) => project.id === projectId
      ? { ...project, tasks: project.tasks.filter((task) => task.id !== taskId) }
      : project));
    if (editingTaskId === taskId) setEditingTaskId(null);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <section className="flex flex-col gap-5 rounded-[28px] border border-[#E7E0D2] bg-[linear-gradient(135deg,#FAF7F2_0%,#E7E0D2_100%)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Badge>Celebration</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-[#313B32]">{pageDetails?.title ?? "Wedding Planning"}</h1>
          <p className="mt-2 max-w-2xl text-[#4E5A52]">
            {pageDetails?.description ?? "A calm, beautiful place for inspiration, vendor notes, timeline decisions, and shared ceremony dreams."}
          </p>
          <p className="mt-4 text-sm text-[#4E5A52]">Signed in as <span className="font-semibold">{user?.name ?? "your account"}</span>. New topics are automatically attributed to your account.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AddItemDialog
            open={addProjectOpen}
            onOpenChange={setAddProjectOpen}
            title="Add a wedding plan"
            description="Create a plan and then add checklist steps."
            triggerLabel="Add a wedding plan"
          >
            <div className="space-y-3">
              <input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} placeholder="Plan title, e.g. Ceremony" aria-label="Wedding plan title" required className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
              <input value={projectDue} onChange={(event) => setProjectDue(event.target.value)} placeholder="Target date or month (optional)" aria-label="Target date or month" className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setAddProjectOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleAddProject}>Add plan</Button>
              </div>
            </div>
          </AddItemDialog>
          <AddItemDialog
            open={addMoodOpen}
            onOpenChange={setAddMoodOpen}
            title="Add to wedding mood board"
            description="Save an inspiration image with a title and note."
            triggerLabel="Add inspiration"
          >
            <div className="space-y-3">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Mood name" aria-label="Mood name" required className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
              <input type="file" accept="image/*" onChange={handleFileChange} aria-label="Inspiration image" className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32]" />
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Add a note or description for this inspiration" aria-label="Inspiration description" className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
              {image && (
                <div className="overflow-hidden rounded-2xl border border-[#E7E0D2]">
                  <Image unoptimized src={image} alt="Inspiration preview" width={1200} height={320} className="h-32 w-full object-cover" />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setAddMoodOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleAddMood}>Add to mood board</Button>
              </div>
            </div>
          </AddItemDialog>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Camera className="h-4 w-4" /> Mood board</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{board.length}</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Saved inspiration boards</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="h-4 w-4" /> Wish list</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{wishListItems.length}</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Priority items and wishes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarHeart className="h-4 w-4" /> Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{projects.reduce((total, project) => total + project.tasks.length, 0)}</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Checklist steps across wedding plans</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-[#313B32]">Wedding plans and checklist</h2>
          <p className="mt-1 text-sm text-[#4E5A52]">Break the big decisions into small steps and keep track of what is done.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map((project) => {
            const progress = getProgress(project.tasks);

            return (
              <Card key={project.id} className={getAuthorCardClass(project.createdBy)}>
                <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                  <div className="min-w-0 flex-1">
                    {editingProjectId === project.id ? (
                      <div className="space-y-2">
                        <input
                          value={projectEdit.title}
                          onChange={(event) => setProjectEdit((current) => ({ ...current, title: event.target.value }))}
                          aria-label="Wedding plan title"
                          className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                        />
                        <input
                          value={projectEdit.due}
                          onChange={(event) => setProjectEdit((current) => ({ ...current, due: event.target.value }))}
                          aria-label="Wedding plan target date"
                          className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                        />
                        <div className="flex gap-2">
                          <Button type="button" size="sm" onClick={() => handleSaveProjectEdit(project.id)}>Save</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setEditingProjectId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardTitle>{project.title}</CardTitle>
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#71866E]">Target · {project.due}</p>
                        <Badge className={`mt-2 ${getAuthorBadgeClass(project.createdBy)}`}>{project.createdBy}</Badge>
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge>{progress}%</Badge>
                    <div className="flex">
                      <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${project.title}`} onClick={() => handleStartProjectEdit(project)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${project.title}`} onClick={() => handleDeleteProject(project.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progress} />
                  <div className="space-y-2 rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#71866E]">Checklist</p>
                    {project.tasks.length === 0 ? (
                      <p className="mt-2 text-sm text-[#4E5A52]">No tasks yet. Add the first step for this plan.</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {project.tasks.map((task) => (
                          <li key={task.id} className="flex items-start gap-3 rounded-xl bg-white/70 px-2 py-2">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => handleTaskToggle(project.id, task.id)}
                              className="mt-1 h-4 w-4 accent-[#71866E]"
                            />
                            {editingTaskId === task.id ? (
                              <div className="flex min-w-0 flex-1 gap-2">
                                <input
                                  value={taskEditText}
                                  onChange={(event) => setTaskEditText(event.target.value)}
                                  aria-label="Wedding checklist task"
                                  className="min-w-0 flex-1 rounded-xl border border-[#E7E0D2] bg-white px-2 py-1 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                                />
                                <Button type="button" size="sm" onClick={() => handleSaveTaskEdit(project.id, task.id)}>Save</Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingTaskId(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <>
                                <span className={`min-w-0 flex-1 ${task.done ? "text-[#71866E] line-through" : "text-[#313B32]"}`}>{task.text}</span>
                                <Badge className={getAuthorBadgeClass(task.createdBy)}>{task.createdBy}</Badge>
                                <div className="flex shrink-0">
                                  <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${task.text}`} onClick={() => handleStartTaskEdit(task)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${task.text}`} onClick={() => handleDeleteTask(project.id, task.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3">
                      <AddItemDialog
                        open={addTaskProjectId === project.id}
                        onOpenChange={(open) => setAddTaskProjectId(open ? project.id : null)}
                        title="Add a wedding checklist task"
                        description={`Add a task to ${project.title}.`}
                        triggerLabel="Add a task"
                      >
                        <form
                          className="space-y-3"
                          onSubmit={(event) => {
                            event.preventDefault();
                            handleAddTask(project.id);
                          }}
                        >
                          <input
                            value={taskDrafts[project.id] ?? ""}
                            onChange={(event) => setTaskDrafts((current) => ({ ...current, [project.id]: event.target.value }))}
                            placeholder="Task description"
                            aria-label={`Add task to ${project.title}`}
                            required
                            className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setAddTaskProjectId(null)}>Cancel</Button>
                            <Button type="submit">Add task</Button>
                          </div>
                        </form>
                      </AddItemDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Wedding mood board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {board.map((item) => (
                <div key={item.id} className={`overflow-hidden rounded-3xl border border-[#E7E0D2] ${getAuthorCardClass(item.createdBy)}`}>
                  {editingMoodId === item.id ? (
                    <div className="space-y-3 p-3">
                      {moodEdit.image && (
                        <Image unoptimized src={moodEdit.image} alt={moodEdit.title || "Preview"} width={800} height={512} className="h-52 w-full rounded-2xl object-cover" />
                      )}
                      <input
                        value={moodEdit.title}
                        onChange={(event) => setMoodEdit((current) => ({ ...current, title: event.target.value }))}
                        aria-label="Mood board title"
                        className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                      />
                      <textarea
                        value={moodEdit.note}
                        onChange={(event) => setMoodEdit((current) => ({ ...current, note: event.target.value }))}
                        rows={3}
                        aria-label="Mood board note"
                        className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMoodEditFileChange}
                        aria-label="Replace mood board image"
                        className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32]"
                      />
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={() => handleSaveMoodEdit(item.id)}>Save</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingMoodId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={800}
                        height={512}
                        className="h-52 w-full object-cover"
                      />
                      <div className="flex items-start justify-between gap-2 p-3">
                        <div>
                          <p className="font-medium text-[#313B32]">{item.title}</p>
                          <p className="mt-1 text-sm text-[#4E5A52]">{item.note}</p>
                          <Badge className={`mt-2 ${getAuthorBadgeClass(item.createdBy)}`}>{item.createdBy}</Badge>
                        </div>
                        <div className="flex shrink-0">
                          <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${item.title}`} onClick={() => handleStartMoodEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${item.title}`} onClick={() => handleDeleteMood(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wish list</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {wishListItems.map((item) => (
              <div key={item.name} className="rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-[#313B32]">{item.name}</p>
                  <Badge>{item.priority}</Badge>
                </div>
                <p className="mt-2 text-sm text-[#4E5A52]">Status: {item.status}</p>
                <p className="mt-1 text-sm text-[#4E5A52]">Estimated cost: {item.cost ? `₱${item.cost.toLocaleString()}` : `Not set yet`}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
