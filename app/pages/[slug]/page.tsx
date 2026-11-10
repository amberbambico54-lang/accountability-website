"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { Progress } from "@/components/ui/progress";
import { useWorkspacePages } from "@/components/workspace-pages-provider";
import { getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";
import { useLocalStorageJson } from "@/lib/use-local-storage-json";

type CustomTask = {
  id: string;
  text: string;
  done: boolean;
  createdBy: string;
};

type CustomTopic = {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  tasks: CustomTask[];
};

function normalizeTopics(value: unknown): CustomTopic[] {
  if (!Array.isArray(value)) throw new Error("Saved page topics must be a list.");

  return value.flatMap((item, topicIndex) => {
    if (typeof item !== "object" || item === null) return [];
    const topic = item as Partial<CustomTopic>;
    if (typeof topic.title !== "string") return [];
    const topicId = typeof topic.id === "string" ? topic.id : `topic-${topicIndex}`;
    const createdBy = topic.createdBy === "Alpha" ? "Alpha" : "Fernan";
    const tasks = Array.isArray(topic.tasks)
      ? topic.tasks.flatMap((task, taskIndex) => {
          if (typeof task !== "object" || task === null) return [];
          const parsedTask = task as Partial<CustomTask>;
          if (typeof parsedTask.text !== "string") return [];
          return [{
            id: typeof parsedTask.id === "string" ? parsedTask.id : `${topicId}-task-${taskIndex}`,
            text: parsedTask.text,
            done: Boolean(parsedTask.done),
            createdBy: parsedTask.createdBy === "Alpha" ? "Alpha" : createdBy,
          }];
        })
      : [];

    return [{
      id: topicId,
      title: topic.title,
      description: typeof topic.description === "string" ? topic.description : "",
      createdBy,
      tasks,
    }];
  });
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getProgress(tasks: CustomTask[]) {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((task) => task.done).length / tasks.length) * 100);
}

export default function CustomWorkspacePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { pages } = useWorkspacePages();
  const page = pages.find((item) => item.kind === "custom" && item.slug === params.slug);

  useEffect(() => {
    if (!page) router.replace("/settings");
  }, [page, router]);

  if (!page) {
    return <p className="p-8 text-sm text-[#71866E]">Opening page settings…</p>;
  }

  return <CustomWorkspacePageEditor key={page.id} page={page} />;
}

function CustomWorkspacePageEditor({ page }: { page: { id: string; title: string; description: string } }) {
  const { user } = useAuth();
  const [topics, setTopics] = useLocalStorageJson(`our-space-custom-page-${page.id}`, [] as CustomTopic[], normalizeTopics);
  const [topicDraft, setTopicDraft] = useState("");
  const [topicDescriptionDraft, setTopicDescriptionDraft] = useState("");
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [addTaskTopicId, setAddTaskTopicId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleAddTopic = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = topicDraft.trim();
    if (!title || !user) return;

    setTopics((current) => [{
      id: createId("topic"),
      title,
      description: topicDescriptionDraft.trim(),
      createdBy: user.name,
      tasks: [],
    }, ...current]);
    setTopicDraft("");
    setTopicDescriptionDraft("");
    setAddTopicOpen(false);
  };

  const handleAddTask = (event: React.FormEvent<HTMLFormElement>, topicId: string) => {
    event.preventDefault();
    const text = (taskDrafts[topicId] ?? "").trim();
    if (!text || !user) return;

    setTopics((current) => current.map((topic) => topic.id === topicId
      ? { ...topic, tasks: [...topic.tasks, { id: createId("task"), text, done: false, createdBy: user.name }] }
      : topic));
    setTaskDrafts((current) => ({ ...current, [topicId]: "" }));
    setAddTaskTopicId(null);
  };

  const handleToggleTask = (topicId: string, taskId: string) => {
    setTopics((current) => current.map((topic) => topic.id === topicId
      ? { ...topic, tasks: topic.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task) }
      : topic));
  };

  const handleDeleteTopic = (topicId: string) => {
    setTopics((current) => current.filter((topic) => topic.id !== topicId));
    if (editingTopicId === topicId) setEditingTopicId(null);
  };

  const handleDeleteTask = (topicId: string, taskId: string) => {
    setTopics((current) => current.map((topic) => topic.id === topicId
      ? { ...topic, tasks: topic.tasks.filter((task) => task.id !== taskId) }
      : topic));
  };

  const handleSaveTopic = (topicId: string) => {
    const title = editTitle.trim();
    if (!title) return;
    setTopics((current) => current.map((topic) => topic.id === topicId ? { ...topic, title } : topic));
    setEditingTopicId(null);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <section className="flex flex-col gap-5 rounded-[28px] border border-[#E7E0D2] bg-[linear-gradient(135deg,#FAF7F2_0%,#E7E0D2_100%)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <Badge>Custom page</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-[#313B32]">{page.title}</h1>
          {page.description && <p className="mt-2 max-w-2xl text-[#4E5A52]">{page.description}</p>}
        </div>
        <AddItemDialog
          open={addTopicOpen}
          onOpenChange={setAddTopicOpen}
          title="Add a topic"
          description="Create a topic, then build a checklist to track its progress."
          triggerLabel="Add a topic"
        >
          <form onSubmit={handleAddTopic} className="space-y-3">
            <input value={topicDraft} onChange={(event) => setTopicDraft(event.target.value)} placeholder="Topic title" aria-label="Topic title" required className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <textarea value={topicDescriptionDraft} onChange={(event) => setTopicDescriptionDraft(event.target.value)} placeholder="Describe this topic (optional)" aria-label="Topic description" rows={3} className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <p className="text-sm text-[#4E5A52]">Added by {user?.name ?? "your account"}</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAddTopicOpen(false)}>Cancel</Button>
              <Button type="submit">Add topic</Button>
            </div>
          </form>
        </AddItemDialog>
      </section>

      {topics.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-6 text-sm text-[#4E5A52]">
            <FileText className="h-5 w-5 text-[#71866E]" />
            No topics yet. Add a topic above, then build its checklist.
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {topics.map((topic) => {
            const progress = getProgress(topic.tasks);
            return (
              <Card key={topic.id} className={`min-w-0 ${getAuthorCardClass(topic.createdBy)}`}>
                <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 w-full flex-1">
                    {editingTopicId === topic.id ? (
                      <form
                        className="flex flex-wrap gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleSaveTopic(topic.id);
                        }}
                      >
                        <input
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                          aria-label="Edit topic title"
                          required
                          className="min-w-0 flex-1 rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32]"
                        />
                        <Button type="submit" size="sm">Save</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingTopicId(null)}>Cancel</Button>
                      </form>
                    ) : (
                      <>
                        <CardTitle>{topic.title}</CardTitle>
                        {topic.description && <p className="mt-1 text-sm text-[#4E5A52]">{topic.description}</p>}
                        <Badge className={`mt-2 ${getAuthorBadgeClass(topic.createdBy)}`}>{topic.createdBy}</Badge>
                      </>
                    )}
                  </div>
                  {editingTopicId !== topic.id && (
                    <div className="flex shrink-0 self-end sm:self-auto">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${topic.title}`}
                        onClick={() => {
                          setEditingTopicId(topic.id);
                          setEditTitle(topic.title);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${topic.title}`} onClick={() => handleDeleteTopic(topic.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <Badge>{progress}%</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progress} />
                  <div className="space-y-2 rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#71866E]">Checklist</p>
                    {topic.tasks.length === 0 ? (
                      <p className="mt-2 text-sm text-[#4E5A52]">No tasks yet. Add the first step for this topic.</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {topic.tasks.map((task) => (
                          <li key={task.id} className="flex min-w-0 flex-wrap items-start gap-2 rounded-xl bg-white/70 px-2 py-2 sm:gap-3">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => handleToggleTask(topic.id, task.id)}
                              aria-label={`Mark ${task.text} ${task.done ? "incomplete" : "complete"}`}
                              className="mt-1 h-4 w-4 accent-[#71866E]"
                            />
                            <span className={task.done ? "min-w-0 flex-1 basis-[calc(100%-2rem)] text-[#71866E] line-through" : "min-w-0 flex-1 basis-[calc(100%-2rem)] text-[#313B32]"}>{task.text}</span>
                            <Badge className={`shrink-0 ${getAuthorBadgeClass(task.createdBy)}`}>{task.createdBy}</Badge>
                            <Button type="button" size="icon" variant="ghost" aria-label={`Delete task ${task.text}`} onClick={() => handleDeleteTask(topic.id, task.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <AddItemDialog
                      open={addTaskTopicId === topic.id}
                      onOpenChange={(open) => setAddTaskTopicId(open ? topic.id : null)}
                      title="Add checklist task"
                      description={`Add a task to ${topic.title}.`}
                      triggerLabel="Add a task"
                    >
                      <form className="space-y-3" onSubmit={(event) => handleAddTask(event, topic.id)}>
                        <input
                          value={taskDrafts[topic.id] ?? ""}
                          onChange={(event) => setTaskDrafts((current) => ({ ...current, [topic.id]: event.target.value }))}
                          placeholder="Task description"
                          aria-label={`Add task to ${topic.title}`}
                          required
                          className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" onClick={() => setAddTaskTopicId(null)}>Cancel</Button>
                          <Button type="submit"><Plus className="h-4 w-4" /> Add task</Button>
                        </div>
                      </form>
                    </AddItemDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
