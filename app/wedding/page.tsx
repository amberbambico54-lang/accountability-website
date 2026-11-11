"use client";

import Image from "next/image";
import { useState } from "react";
import { CalendarHeart, Camera, Gift, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { Progress } from "@/components/ui/progress";
import { weddingMoodBoard, weddingProjects, wishListItems } from "@/lib/content";
import { useAuth } from "@/components/auth-provider";
import { canManageContent, getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";
import { useWorkspacePages } from "@/components/workspace-pages-provider";
import { useLocalStorageJson } from "@/lib/use-local-storage-json";
import { prepareImageForStorage } from "@/lib/image-upload";

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

type WeddingWish = {
  id: string;
  name: string;
  cost: number;
  priority: string;
  status: string;
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

const wishListStorageKey = "our-space-wedding-wishlist";
const initialWishList: WeddingWish[] = wishListItems.map((item, index) => ({
  ...item,
  id: `wedding-wish-${index}`,
  createdBy: "Fernan",
}));

function parseWishList(value: unknown): WeddingWish[] {
  if (!Array.isArray(value)) throw new Error("Saved wish list data must be a list.");
  return value.flatMap((item, index) => {
    if (typeof item !== "object" || item === null) return [];
    const wish = item as Partial<WeddingWish>;
    if (typeof wish.name !== "string") return [];
    const cost = Number(wish.cost);
    return [{
      id: typeof wish.id === "string" ? wish.id : `wedding-wish-${index}`,
      name: wish.name,
      cost: Number.isFinite(cost) && cost > 0 ? cost : 0,
      priority: typeof wish.priority === "string" ? wish.priority : "Medium",
      status: typeof wish.status === "string" ? wish.status : "Planning",
      createdBy: wish.createdBy === "Alpha" ? "Alpha" : "Fernan",
    }];
  });
}

function parseMoodBoard(value: unknown): MoodBoardItem[] {
  if (!Array.isArray(value)) throw new Error("Saved mood board data must be a list.");
  return value.flatMap((item, index) => {
    if (typeof item !== "object" || item === null) return [];
    const mood = item as Partial<MoodBoardItem>;
    const savedImage = typeof mood.image === "string" ? mood.image : "";
    return [{
      id: typeof mood.id === "string" ? mood.id : `wedding-mood-${index}`,
      title: typeof mood.title === "string" ? mood.title : "Wedding inspiration",
      note: typeof mood.note === "string" ? mood.note : "",
      image: savedImage.startsWith("blob:") || !savedImage ? initialMoodBoard[index]?.image ?? "" : savedImage,
      createdBy: mood.createdBy === "Alpha" ? "Alpha" : "Fernan",
    }];
  });
}

function parseWeddingProjects(value: unknown): WeddingProject[] {
  if (!Array.isArray(value)) throw new Error("Saved wedding plan data must be a list.");
  return value.flatMap((item, index) => {
    if (typeof item !== "object" || item === null) return [];
    const project = item as Partial<WeddingProject>;
    const tasks = Array.isArray(project.tasks) ? project.tasks : [];
    return [{
      id: typeof project.id === "string" ? project.id : `wedding-project-${index}`,
      title: typeof project.title === "string" ? project.title : "Untitled plan",
      due: typeof project.due === "string" ? project.due : "TBD",
      createdBy: project.createdBy === "Alpha" ? "Alpha" : "Fernan",
      tasks: tasks.flatMap((task, taskIndex) => {
        if (typeof task !== "object" || task === null) return [];
        const parsedTask = task as Partial<WeddingTask>;
        return [{
          id: typeof parsedTask.id === "string" ? parsedTask.id : `wedding-project-${index}-task-${taskIndex}`,
          text: typeof parsedTask.text === "string" ? parsedTask.text : "New task",
          done: Boolean(parsedTask.done),
          createdBy: parsedTask.createdBy === "Alpha" ? "Alpha" : "Fernan",
        }];
      }),
    }];
  });
}

export default function WeddingPage() {
  const { user } = useAuth();
  const { pages } = useWorkspacePages();
  const pageDetails = pages.find((page) => page.kind === "wedding");
  const [board, setBoard] = useLocalStorageJson(storageKey, initialMoodBoard, parseMoodBoard);
  const [projects, setProjects] = useLocalStorageJson(projectsStorageKey, initialWeddingProjects, parseWeddingProjects);
  const [wishList, setWishList] = useLocalStorageJson(wishListStorageKey, initialWishList, parseWishList);
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
  const [imageError, setImageError] = useState("");
  const [wishDialogOpen, setWishDialogOpen] = useState(false);
  const [wishDraft, setWishDraft] = useState({ name: "", cost: "", priority: "Medium", status: "Planning" });
  const [editingWishId, setEditingWishId] = useState<string | null>(null);
  const [wishEdit, setWishEdit] = useState({ name: "", cost: "", priority: "Medium", status: "Planning" });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    try {
      setImage(await prepareImageForStorage(file));
      setImageError("");
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "The image could not be uploaded.");
    }
  };

  const handleAddMood = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    if (!canManageContent(item.createdBy, user?.name)) return;
    setEditingMoodId(item.id);
    setMoodEdit({ title: item.title, note: item.note, image: item.image });
  };

  const handleMoodEditFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    try {
      const preparedImage = await prepareImageForStorage(file);
      setMoodEdit((current) => ({ ...current, image: preparedImage }));
      setImageError("");
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "The image could not be uploaded.");
    }
  };

  const handleSaveMoodEdit = (itemId: string) => {
    const item = board.find((mood) => mood.id === itemId);
    if (!canManageContent(item?.createdBy, user?.name)) return;
    if (!moodEdit.title.trim()) return;

    setBoard((current) => current.map((item) => item.id === itemId
      ? { ...item, title: moodEdit.title.trim(), note: moodEdit.note.trim(), image: moodEdit.image }
      : item));
    setEditingMoodId(null);
  };

  const handleDeleteMood = (itemId: string) => {
    const item = board.find((mood) => mood.id === itemId);
    if (!canManageContent(item?.createdBy, user?.name)) return;
    setBoard((current) => current.filter((item) => item.id !== itemId));
    if (editingMoodId === itemId) setEditingMoodId(null);
  };

  const handleAddProject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    if (!project || !canManageContent(project.createdBy, user.name)) return;
    const taskId = createUniqueId(`${projectId}-task`, project.tasks.map((task) => task.id));

    setProjects((current) => current.map((project) => project.id === projectId
      ? { ...project, tasks: [...project.tasks, { id: taskId, text: taskText, done: false, createdBy: user.name }] }
      : project));
    setTaskDrafts((current) => ({ ...current, [projectId]: "" }));
    setAddTaskProjectId(null);
  };

  const handleTaskToggle = (projectId: string, taskId: string) => {
    const project = projects.find((item) => item.id === projectId);
    if (!canManageContent(project?.createdBy, user?.name)) return;
    setProjects((current) => current.map((project) => project.id === projectId
      ? { ...project, tasks: project.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task) }
      : project));
  };

  const handleStartProjectEdit = (project: WeddingProject) => {
    if (!canManageContent(project.createdBy, user?.name)) return;
    setEditingProjectId(project.id);
    setProjectEdit({ title: project.title, due: project.due });
  };

  const handleSaveProjectEdit = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    if (!canManageContent(project?.createdBy, user?.name)) return;
    if (!projectEdit.title.trim()) return;

    setProjects((current) => current.map((project) => project.id === projectId
      ? { ...project, title: projectEdit.title.trim(), due: projectEdit.due.trim() || "TBD" }
      : project));
    setEditingProjectId(null);
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    if (!canManageContent(project?.createdBy, user?.name)) return;
    setProjects((current) => current.filter((project) => project.id !== projectId));
    if (editingProjectId === projectId) setEditingProjectId(null);
  };

  const handleStartTaskEdit = (projectId: string, task: WeddingTask) => {
    const project = projects.find((item) => item.id === projectId);
    if (!canManageContent(project?.createdBy, user?.name)) return;
    setEditingTaskId(task.id);
    setTaskEditText(task.text);
  };

  const handleSaveTaskEdit = (projectId: string, taskId: string) => {
    const project = projects.find((item) => item.id === projectId);
    if (!canManageContent(project?.createdBy, user?.name)) return;
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
    const project = projects.find((item) => item.id === projectId);
    if (!canManageContent(project?.createdBy, user?.name)) return;
    setProjects((current) => current.map((project) => project.id === projectId
      ? { ...project, tasks: project.tasks.filter((task) => task.id !== taskId) }
      : project));
    if (editingTaskId === taskId) setEditingTaskId(null);
  };

  const handleAddWish = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = wishDraft.name.trim();
    const cost = Number(wishDraft.cost || 0);
    if (!name || !Number.isFinite(cost) || cost < 0 || !user) return;
    setWishList((current) => [{
      id: createUniqueId("wedding-wish", current.map((item) => item.id)),
      name,
      cost,
      priority: wishDraft.priority,
      status: wishDraft.status,
      createdBy: user.name,
    }, ...current]);
    setWishDraft({ name: "", cost: "", priority: "Medium", status: "Planning" });
    setWishDialogOpen(false);
  };

  const handleSaveWish = (wishId: string) => {
    const wish = wishList.find((item) => item.id === wishId);
    if (!canManageContent(wish?.createdBy, user?.name)) return;
    const name = wishEdit.name.trim();
    const cost = Number(wishEdit.cost || 0);
    if (!name || !Number.isFinite(cost) || cost < 0) return;
    setWishList((current) => current.map((item) => item.id === wishId
      ? { ...item, name, cost, priority: wishEdit.priority, status: wishEdit.status }
      : item));
    setEditingWishId(null);
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
            <form className="space-y-3" onSubmit={handleAddProject}>
              <input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} placeholder="Plan title, e.g. Ceremony" aria-label="Wedding plan title" required className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
              <input value={projectDue} onChange={(event) => setProjectDue(event.target.value)} placeholder="Target date or month (optional)" aria-label="Target date or month" className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setAddProjectOpen(false)}>Cancel</Button>
                <Button type="submit">Add plan</Button>
              </div>
            </form>
          </AddItemDialog>
          <AddItemDialog
            open={addMoodOpen}
            onOpenChange={setAddMoodOpen}
            title="Add to wedding mood board"
            description="Save an inspiration image with a title and note."
            triggerLabel="Add inspiration"
          >
            <form className="space-y-3" onSubmit={handleAddMood}>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Mood name" aria-label="Mood name" required className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
              <input type="file" accept="image/*" onChange={handleFileChange} aria-label="Inspiration image" className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32]" />
              {imageError && <p role="alert" className="text-sm text-[#8B3F3F]">{imageError}</p>}
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Add a note or description for this inspiration" aria-label="Inspiration description" className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
              {image && (
                <div className="overflow-hidden rounded-2xl border border-[#E7E0D2]">
                  <Image unoptimized src={image} alt="Inspiration preview" width={1200} height={320} className="h-32 w-full object-cover" />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setAddMoodOpen(false)}>Cancel</Button>
                <Button type="submit">Add to mood board</Button>
              </div>
            </form>
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
            <p className="text-2xl font-semibold text-[#313B32]">{wishList.length}</p>
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
            const canManageProject = canManageContent(project.createdBy, user?.name);

            return (
              <Card key={project.id} className={`min-w-0 ${getAuthorCardClass(project.createdBy)}`}>
                <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 w-full flex-1">
                    {editingProjectId === project.id && canManageProject ? (
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
                  <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
                    <Badge>{progress}%</Badge>
                    {canManageProject && (
                      <div className="flex">
                        <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${project.title}`} onClick={() => handleStartProjectEdit(project)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDeleteButton itemName={project.title} ariaLabel={`Delete ${project.title}`} onConfirm={() => handleDeleteProject(project.id)} />
                      </div>
                    )}
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
                          <li key={task.id} className="flex min-w-0 flex-wrap items-start gap-2 rounded-xl bg-white/70 px-2 py-2 sm:gap-3">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => handleTaskToggle(project.id, task.id)}
                              disabled={!canManageProject}
                              className="mt-1 h-4 w-4 accent-[#71866E]"
                            />
                            {editingTaskId === task.id && canManageProject ? (
                              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
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
                                <span className={`min-w-0 flex-1 basis-[calc(100%-2rem)] ${task.done ? "text-[#71866E] line-through" : "text-[#313B32]"}`}>{task.text}</span>
                                <Badge className={`shrink-0 ${getAuthorBadgeClass(task.createdBy)}`}>{task.createdBy}</Badge>
                                {canManageProject && <div className="flex shrink-0">
                                  <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${task.text}`} onClick={() => handleStartTaskEdit(project.id, task)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <ConfirmDeleteButton itemName={task.text} ariaLabel={`Delete ${task.text}`} onConfirm={() => handleDeleteTask(project.id, task.id)} />
                                </div>}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {canManageProject ? <div className="mt-3">
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
                    </div> : <p className="mt-3 text-sm text-[#71866E]">Only {project.createdBy} can edit this plan or manage its tasks.</p>}
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
                  {editingMoodId === item.id && canManageContent(item.createdBy, user?.name) ? (
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
                      {imageError && <p role="alert" className="text-sm text-[#8B3F3F]">{imageError}</p>}
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
                        unoptimized={item.image.startsWith("data:")}
                        className="h-52 w-full object-cover"
                      />
                      <div className="flex items-start justify-between gap-2 p-3">
                        <div>
                          <p className="font-medium text-[#313B32]">{item.title}</p>
                          <p className="mt-1 text-sm text-[#4E5A52]">{item.note}</p>
                          <Badge className={`mt-2 ${getAuthorBadgeClass(item.createdBy)}`}>{item.createdBy}</Badge>
                          {!canManageContent(item.createdBy, user?.name) && <p className="mt-1 text-xs text-[#71866E]">Only {item.createdBy} can edit or delete this inspiration.</p>}
                        </div>
                        {canManageContent(item.createdBy, user?.name) && (
                          <div className="flex shrink-0">
                            <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${item.title}`} onClick={() => handleStartMoodEdit(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <ConfirmDeleteButton itemName={item.title} ariaLabel={`Delete ${item.title}`} onConfirm={() => handleDeleteMood(item.id)} />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Wish list</CardTitle>
            <AddItemDialog open={wishDialogOpen} onOpenChange={setWishDialogOpen} title="Add a wedding wish" description="Keep an item, its estimated cost, priority, and status in the shared list." triggerLabel="Add wish">
              <form className="space-y-3" onSubmit={handleAddWish}>
                <input required value={wishDraft.name} onChange={(event) => setWishDraft({ ...wishDraft, name: event.target.value })} placeholder="Item or wish" aria-label="Wish name" className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                <input type="number" min="0" step="0.01" value={wishDraft.cost} onChange={(event) => setWishDraft({ ...wishDraft, cost: event.target.value })} placeholder="Estimated cost (optional)" aria-label="Estimated cost" className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select value={wishDraft.priority} onChange={(event) => setWishDraft({ ...wishDraft, priority: event.target.value })} aria-label="Wish priority" className="rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm"><option>High</option><option>Medium</option><option>Low</option></select>
                  <input value={wishDraft.status} onChange={(event) => setWishDraft({ ...wishDraft, status: event.target.value })} aria-label="Wish status" placeholder="Status" className="rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                </div>
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setWishDialogOpen(false)}>Cancel</Button><Button type="submit">Add wish</Button></div>
              </form>
            </AddItemDialog>
          </CardHeader>
          <CardContent className="space-y-3">
            {wishList.length === 0 && <p className="text-sm text-[#4E5A52]">No wishes have been added yet.</p>}
            {wishList.map((item) => (
              <div key={item.id} className={`rounded-2xl border border-[#E7E0D2] p-3 ${getAuthorCardClass(item.createdBy)}`}>
                {editingWishId === item.id && canManageContent(item.createdBy, user?.name) ? (
                  <div className="space-y-2">
                    <input value={wishEdit.name} onChange={(event) => setWishEdit({ ...wishEdit, name: event.target.value })} aria-label="Edit wish name" className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                    <input type="number" min="0" step="0.01" value={wishEdit.cost} onChange={(event) => setWishEdit({ ...wishEdit, cost: event.target.value })} aria-label="Edit wish cost" className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select value={wishEdit.priority} onChange={(event) => setWishEdit({ ...wishEdit, priority: event.target.value })} aria-label="Edit wish priority" className="rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm"><option>High</option><option>Medium</option><option>Low</option></select>
                      <input value={wishEdit.status} onChange={(event) => setWishEdit({ ...wishEdit, status: event.target.value })} aria-label="Edit wish status" className="rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                    </div>
                    <div className="flex gap-2"><Button type="button" size="sm" onClick={() => handleSaveWish(item.id)}>Save</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEditingWishId(null)}>Cancel</Button></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-[#313B32]">{item.name}</p>
                      <Badge>{item.priority}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[#4E5A52]">Status: {item.status}</p>
                    <p className="mt-1 text-sm text-[#4E5A52]">Estimated cost: {item.cost ? `₱${item.cost.toLocaleString()}` : "Not set yet"}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge className={getAuthorBadgeClass(item.createdBy)}>{item.createdBy}</Badge>
                      {!canManageContent(item.createdBy, user?.name) && <span className="text-xs text-[#71866E]">Only {item.createdBy} can edit or delete this wish.</span>}
                      {canManageContent(item.createdBy, user?.name) && (
                        <div className="flex">
                          <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${item.name}`} onClick={() => {
                            setEditingWishId(item.id);
                            setWishEdit({ name: item.name, cost: String(item.cost || ""), priority: item.priority, status: item.status });
                          }}><Pencil className="h-4 w-4" /></Button>
                          <ConfirmDeleteButton itemName={item.name} ariaLabel={`Delete ${item.name}`} onConfirm={() => {
                            if (!canManageContent(item.createdBy, user?.name)) return;
                            setWishList((current) => current.filter((wish) => wish.id !== item.id));
                          }} />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
