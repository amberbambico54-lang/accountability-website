"use client";

import { useEffect, useState } from "react";
import { Goal, Pencil, Trash2, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { Progress } from "@/components/ui/progress";
import { annualGoals } from "@/lib/content";
import { useAuth } from "@/components/auth-provider";
import { getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";

const storageKey = "our-space-annual-goals";

type GoalTask = {
  id: string;
  text: string;
  done: boolean;
  createdBy: string;
};

type GoalChecklist = {
  id: string;
  title: string;
  createdBy: string;
  tasks: GoalTask[];
};

type GoalItem = {
  id: string;
  title: string;
  category: string;
  owner: string;
  createdBy: string;
  description: string;
  checklists: GoalChecklist[];
};

const initialGoals: GoalItem[] = annualGoals.map((goal, index) => ({
  id: `annual-goal-${index}`,
  title: goal.title,
  category: goal.category,
  owner: goal.owner,
  createdBy: "Fernan",
  description: goal.description,
  checklists: [{
    id: `annual-goal-${index}-checklist`,
    title: goal.category,
    createdBy: "Fernan",
    tasks: goal.tasks.map((task) => ({ ...task, createdBy: "Fernan" })),
  }],
}));

const normalizeTasks = (tasks: unknown, fallbackPrefix: string): GoalTask[] => {
  if (!Array.isArray(tasks)) return [];

  return tasks.map((task: Partial<GoalTask>, index: number) => ({
    id: typeof task.id === "string" ? task.id : `${fallbackPrefix}-task-${index}`,
    text: typeof task.text === "string" ? task.text : "New task",
    done: Boolean(task.done),
    createdBy: task.createdBy === "Alpha" ? "Alpha" : "Fernan",
  }));
};

const normalizeGoals = (value: unknown): GoalItem[] | null => {
  if (!Array.isArray(value)) return null;

  return value.map((goal: Partial<GoalItem> & { tasks?: unknown }, index: number) => {
    const goalId = typeof goal.id === "string" ? goal.id : `goal-${index}`;
    const checklists = Array.isArray(goal.checklists)
      ? goal.checklists.map((checklist: Partial<GoalChecklist>, checklistIndex: number) => ({
          id: typeof checklist.id === "string" ? checklist.id : `${goalId}-checklist-${checklistIndex}`,
          title: typeof checklist.title === "string" ? checklist.title : "Untitled checklist",
          createdBy: checklist.createdBy === "Alpha" ? "Alpha" : "Fernan",
          tasks: normalizeTasks(checklist.tasks, `${goalId}-checklist-${checklistIndex}`),
        }))
      : Array.isArray(goal.tasks)
        ? [{
            id: `${goalId}-checklist`,
            title: typeof goal.category === "string" ? goal.category : "General",
            createdBy: "Fernan",
            tasks: normalizeTasks(goal.tasks, goalId),
          }]
        : [];

    return {
      id: goalId,
      title: typeof goal.title === "string" ? goal.title : "Untitled goal",
      category: typeof goal.category === "string" ? goal.category : "Other",
      owner: typeof goal.owner === "string" ? goal.owner : "Shared",
      createdBy: goal.createdBy === "Alpha" ? "Alpha" : "Fernan",
      description: typeof goal.description === "string" ? goal.description : "",
      checklists,
    };
  });
};

const getAllTasks = (goal: GoalItem) => goal.checklists.flatMap((checklist) => checklist.tasks);

const getProgress = (goal: GoalItem) => {
  const tasks = getAllTasks(goal);
  return tasks.length ? Math.round((tasks.filter((task) => task.done).length / tasks.length) * 100) : 0;
};

const createUniqueId = (prefix: string, existingIds: string[]) => {
  let index = existingIds.length;
  let id = `${prefix}-${index}`;
  while (existingIds.includes(id)) {
    index += 1;
    id = `${prefix}-${index}`;
  }
  return id;
};

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalItem[]>(() => {
    if (typeof window === "undefined") return initialGoals;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return initialGoals;

    try {
      return normalizeGoals(JSON.parse(saved)) ?? initialGoals;
    } catch {
      return initialGoals;
    }
  });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Faith");
  const [description, setDescription] = useState("");
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [checklistTitleDrafts, setChecklistTitleDrafts] = useState<Record<string, string>>({});
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [addChecklistGoalId, setAddChecklistGoalId] = useState<string | null>(null);
  const [addTaskChecklistId, setAddTaskChecklistId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalEdit, setGoalEdit] = useState({ title: "", category: "", description: "" });
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [checklistEditTitle, setChecklistEditTitle] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskEditText, setTaskEditText] = useState("");

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(goals));
  }, [goals]);

  const handleAddGoal = () => {
    if (!title.trim()) return;
    if (!user) return;

    const nextGoal: GoalItem = {
      id: createUniqueId("goal", goals.map((goal) => goal.id)),
      title: title.trim(),
      category,
      owner: "Shared",
      createdBy: user.name,
      description: description.trim() || "A meaningful goal we want to keep building together.",
      checklists: [],
    };
    setGoals((current) => [nextGoal, ...current]);
    setTitle("");
    setCategory("Faith");
    setDescription("");
    setAddGoalOpen(false);
  };

  const handleAddChecklist = (goalId: string) => {
    const checklistTitle = (checklistTitleDrafts[goalId] ?? "").trim();
    if (!checklistTitle) return;
    if (!user) return;

    const goal = goals.find((item) => item.id === goalId);
    if (!goal) return;

    const checklistId = createUniqueId(`${goalId}-checklist`, goal.checklists.map((checklist) => checklist.id));
    setGoals((current) => current.map((goal) => goal.id === goalId
      ? { ...goal, checklists: [...goal.checklists, { id: checklistId, title: checklistTitle, createdBy: user.name, tasks: [] }] }
      : goal));
    setChecklistTitleDrafts((current) => ({ ...current, [goalId]: "" }));
    setAddChecklistGoalId(null);
  };

  const handleAddTask = (goalId: string, checklistId: string) => {
    const taskText = (taskDrafts[checklistId] ?? "").trim();
    if (!taskText) return;
    if (!user) return;

    const goal = goals.find((item) => item.id === goalId);
    const checklist = goal?.checklists.find((item) => item.id === checklistId);
    if (!checklist) return;

    const taskId = createUniqueId(`${checklistId}-task`, checklist.tasks.map((task) => task.id));
    setGoals((current) => current.map((goal) => goal.id === goalId
      ? {
          ...goal,
          checklists: goal.checklists.map((checklist) => checklist.id === checklistId
            ? { ...checklist, tasks: [...checklist.tasks, { id: taskId, text: taskText, done: false, createdBy: user.name }] }
            : checklist),
        }
      : goal));
    setTaskDrafts((current) => ({ ...current, [checklistId]: "" }));
    setAddTaskChecklistId(null);
  };

  const handleTaskToggle = (goalId: string, checklistId: string, taskId: string) => {
    setGoals((current) => current.map((goal) => goal.id === goalId
      ? {
          ...goal,
          checklists: goal.checklists.map((checklist) => checklist.id === checklistId
            ? { ...checklist, tasks: checklist.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task) }
            : checklist),
        }
      : goal));
  };

  const handleStartGoalEdit = (goal: GoalItem) => {
    setEditingGoalId(goal.id);
    setGoalEdit({ title: goal.title, category: goal.category, description: goal.description });
  };

  const handleSaveGoalEdit = (goalId: string) => {
    if (!goalEdit.title.trim()) return;

    setGoals((current) => current.map((goal) => goal.id === goalId
      ? {
          ...goal,
          title: goalEdit.title.trim(),
          category: goalEdit.category,
          description: goalEdit.description.trim(),
        }
      : goal));
    setEditingGoalId(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((current) => current.filter((goal) => goal.id !== goalId));
    if (editingGoalId === goalId) setEditingGoalId(null);
  };

  const handleStartChecklistEdit = (checklist: GoalChecklist) => {
    setEditingChecklistId(checklist.id);
    setChecklistEditTitle(checklist.title);
  };

  const handleSaveChecklistEdit = (goalId: string, checklistId: string) => {
    if (!checklistEditTitle.trim()) return;

    setGoals((current) => current.map((goal) => goal.id === goalId
      ? {
          ...goal,
          checklists: goal.checklists.map((checklist) => checklist.id === checklistId
            ? { ...checklist, title: checklistEditTitle.trim() }
            : checklist),
        }
      : goal));
    setEditingChecklistId(null);
  };

  const handleDeleteChecklist = (goalId: string, checklistId: string) => {
    setGoals((current) => current.map((goal) => goal.id === goalId
      ? { ...goal, checklists: goal.checklists.filter((checklist) => checklist.id !== checklistId) }
      : goal));
    if (editingChecklistId === checklistId) setEditingChecklistId(null);
  };

  const handleStartTaskEdit = (task: GoalTask) => {
    setEditingTaskId(task.id);
    setTaskEditText(task.text);
  };

  const handleSaveTaskEdit = (goalId: string, checklistId: string, taskId: string) => {
    if (!taskEditText.trim()) return;

    setGoals((current) => current.map((goal) => goal.id === goalId
      ? {
          ...goal,
          checklists: goal.checklists.map((checklist) => checklist.id === checklistId
            ? {
                ...checklist,
                tasks: checklist.tasks.map((task) => task.id === taskId
                  ? { ...task, text: taskEditText.trim() }
                  : task),
              }
            : checklist),
        }
      : goal));
    setEditingTaskId(null);
  };

  const handleDeleteTask = (goalId: string, checklistId: string, taskId: string) => {
    setGoals((current) => current.map((goal) => goal.id === goalId
      ? {
          ...goal,
          checklists: goal.checklists.map((checklist) => checklist.id === checklistId
            ? { ...checklist, tasks: checklist.tasks.filter((task) => task.id !== taskId) }
            : checklist),
        }
      : goal));
    if (editingTaskId === taskId) setEditingTaskId(null);
  };

  const completedTasks = goals.reduce(
    (total, goal) => total + getAllTasks(goal).filter((task) => task.done).length,
    0,
  );

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <section className="flex flex-col gap-5 rounded-[28px] border border-[#E7E0D2] bg-[linear-gradient(135deg,#FAF7F2_0%,#E7E0D2_100%)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Badge>Faith · Family · Fitness · Finances · Future</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-[#313B32]">Faith Goals (5F&apos;s)</h1>
          <p className="mt-2 max-w-2xl text-[#4E5A52]">
            Set meaningful goals and organize their action steps into titled checklists for each area of your 5F&apos;s.
          </p>
          <p className="mt-4 text-sm text-[#4E5A52]">Signed in as <span className="font-semibold">{user?.name ?? "your account"}</span>. New topics are automatically attributed to your account.</p>
        </div>
        <AddItemDialog
          open={addGoalOpen}
          onOpenChange={setAddGoalOpen}
          title="Add a new goal"
          description="Choose a focus area and describe what you want to achieve."
          triggerLabel="Add a new goal"
        >
          <div className="space-y-3">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Goal title" aria-label="Goal title" required className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Goal focus area" className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]">
              <option value="Faith">Faith</option>
              <option value="Family">Family</option>
              <option value="Fitness">Fitness</option>
              <option value="Finances">Finances</option>
              <option value="Future">Future</option>
              <option value="Other">Other</option>
            </select>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="What does success look like?" aria-label="Goal description" className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAddGoalOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleAddGoal}>Add goal</Button>
            </div>
          </div>
        </AddItemDialog>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Goal className="h-4 w-4" /> Goals tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{goals.length}</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Across the areas that matter to you</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Completed steps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{completedTasks}</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Checklist milestones reached</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle><Badge>Focus</Badge></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-[#313B32]">Faith + future</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Grow with intention in every part of your shared life.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {goals.map((goal) => {
          const progress = getProgress(goal);
          const taskCount = getAllTasks(goal).length;

          return (
            <Card key={goal.id} className={getAuthorCardClass(goal.createdBy)}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                <div className="min-w-0 flex-1">
                  {editingGoalId === goal.id ? (
                    <div className="space-y-2">
                      <input
                        value={goalEdit.title}
                        onChange={(event) => setGoalEdit((current) => ({ ...current, title: event.target.value }))}
                        aria-label="Goal title"
                        className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                      />
                      <select
                        value={goalEdit.category}
                        onChange={(event) => setGoalEdit((current) => ({ ...current, category: event.target.value }))}
                        aria-label="Goal category"
                        className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                      >
                        <option value="Faith">Faith</option>
                        <option value="Family">Family</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Finances">Finances</option>
                        <option value="Future">Future</option>
                        <option value="Other">Other</option>
                      </select>
                      <textarea
                        value={goalEdit.description}
                        onChange={(event) => setGoalEdit((current) => ({ ...current, description: event.target.value }))}
                        rows={2}
                        aria-label="Goal description"
                        className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                      />
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={() => handleSaveGoalEdit(goal.id)}>Save</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingGoalId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <CardTitle>{goal.title}</CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-[#71866E]">{goal.category} · {goal.owner}</p>
                        <Badge className={getAuthorBadgeClass(goal.createdBy)}>{goal.createdBy}</Badge>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge>{progress}%</Badge>
                  <div className="flex">
                    <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${goal.title}`} onClick={() => handleStartGoalEdit(goal)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${goal.title}`} onClick={() => handleDeleteGoal(goal.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} />
                {editingGoalId !== goal.id && <p className="text-sm leading-6 text-[#4E5A52]">{goal.description}</p>}
                <div className="space-y-3 rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#71866E]">Checklists</p>
                    <p className="text-xs text-[#71866E]">{getAllTasks(goal).filter((task) => task.done).length} / {taskCount} steps</p>
                  </div>

                  {goal.checklists.length === 0 && (
                    <p className="text-sm text-[#4E5A52]">Add a titled checklist to organize the steps for this goal.</p>
                  )}

                  {goal.checklists.map((checklist) => (
                    <div key={checklist.id} className="rounded-2xl border border-[#E7E0D2] bg-white/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        {editingChecklistId === checklist.id ? (
                          <div className="flex min-w-0 flex-1 gap-2">
                            <input
                              value={checklistEditTitle}
                              onChange={(event) => setChecklistEditTitle(event.target.value)}
                              aria-label="Checklist title"
                              className="min-w-0 flex-1 rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                            />
                            <Button type="button" size="sm" onClick={() => handleSaveChecklistEdit(goal.id, checklist.id)}>Save</Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setEditingChecklistId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <p className="font-medium text-[#313B32]">{checklist.title}</p>
                              <Badge className={`mt-1 ${getAuthorBadgeClass(checklist.createdBy)}`}>{checklist.createdBy}</Badge>
                            </div>
                            <div className="flex shrink-0">
                              <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${checklist.title}`} onClick={() => handleStartChecklistEdit(checklist)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${checklist.title}`} onClick={() => handleDeleteChecklist(goal.id, checklist.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                      {checklist.tasks.length === 0 ? (
                        <p className="mt-2 text-sm text-[#4E5A52]">No steps yet.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {checklist.tasks.map((task) => (
                            <li key={task.id} className="flex items-start gap-3 rounded-xl bg-white px-2 py-2">
                              <input
                                type="checkbox"
                                checked={task.done}
                                onChange={() => handleTaskToggle(goal.id, checklist.id, task.id)}
                                className="mt-1 h-4 w-4 accent-[#71866E]"
                              />
                              {editingTaskId === task.id ? (
                                <div className="flex min-w-0 flex-1 gap-2">
                                  <input
                                    value={taskEditText}
                                    onChange={(event) => setTaskEditText(event.target.value)}
                                    aria-label="Checklist step"
                                    className="min-w-0 flex-1 rounded-xl border border-[#E7E0D2] bg-white px-2 py-1 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                                  />
                                  <Button type="button" size="sm" onClick={() => handleSaveTaskEdit(goal.id, checklist.id, task.id)}>Save</Button>
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
                                    <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${task.text}`} onClick={() => handleDeleteTask(goal.id, checklist.id, task.id)}>
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
                          open={addTaskChecklistId === checklist.id}
                          onOpenChange={(open) => setAddTaskChecklistId(open ? checklist.id : null)}
                          title="Add a checklist step"
                          description={`Add a step to ${checklist.title}.`}
                          triggerLabel="Add a checklist step"
                        >
                          <form
                            className="space-y-3"
                            onSubmit={(event) => {
                              event.preventDefault();
                              handleAddTask(goal.id, checklist.id);
                            }}
                          >
                            <input
                              value={taskDrafts[checklist.id] ?? ""}
                              onChange={(event) => setTaskDrafts((current) => ({ ...current, [checklist.id]: event.target.value }))}
                              placeholder="Checklist step"
                              aria-label={`Add step to ${checklist.title}`}
                              required
                              className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                            />
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="ghost" onClick={() => setAddTaskChecklistId(null)}>Cancel</Button>
                              <Button type="submit">Add step</Button>
                            </div>
                          </form>
                        </AddItemDialog>
                      </div>
                    </div>
                  ))}

                  <div>
                    <AddItemDialog
                      open={addChecklistGoalId === goal.id}
                      onOpenChange={(open) => setAddChecklistGoalId(open ? goal.id : null)}
                      title="Add a checklist"
                      description={`Organize the steps for ${goal.title} under a named checklist.`}
                      triggerLabel="Add checklist"
                    >
                      <form
                        className="space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleAddChecklist(goal.id);
                        }}
                      >
                        <input
                          value={checklistTitleDrafts[goal.id] ?? ""}
                          onChange={(event) => setChecklistTitleDrafts((current) => ({ ...current, [goal.id]: event.target.value }))}
                          placeholder="Checklist title (e.g. Faith, Family)"
                          aria-label={`Checklist title for ${goal.title}`}
                          required
                          className="w-full rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" onClick={() => setAddChecklistGoalId(null)}>Cancel</Button>
                          <Button type="submit">Add checklist</Button>
                        </div>
                      </form>
                    </AddItemDialog>
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
