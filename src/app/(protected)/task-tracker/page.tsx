"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import PageShell from "@/src/components/layout/PageShell";
import SectionCard from "@/src/components/layout/SectionCard";
import FiltersPanels from "@/src/components/task-tracker/FiltersPanels";
import SettingsPanel from "@/src/components/task-tracker/SettingsPanel";
import TaskTable from "@/src/components/task-tracker/TaskTable";
import TopBar from "@/src/components/task-tracker/TopBar";
import GlassModal from "@/src/components/ui/GlassModal";
import { Button } from "@/src/components/ui/button";
import { useAuth } from "@/src/hooks/useAuth";
import { useLocalToday } from "@/src/hooks/useLocalToday";
import { useSaveOnBlur } from "@/src/hooks/useSaveOnBlur";
import {
  getProgressPercent,
  getTaskCounters,
  getTasksForDate,
} from "@/src/lib/task-tracker/metrics";
import { debounce } from "@/src/lib/storage";
import {
  loadTaskTracker,
  readCachedTaskTracker,
  readTaskFilters,
  saveTaskFilters,
  saveTaskTracker,
} from "@/src/lib/db/store";
import {
  normalizeTaskTrackerSettings,
  normalizeTaskTrackerTasks,
} from "@/src/lib/task-tracker/storage";
import type {
  Task,
  TaskTrackerFiltersState,
  TaskTrackerSettings,
  TaskTrackerTasks,
} from "@/src/lib/task-tracker/types";

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTask(text: string, dueDate: string, categoryId?: string): Task {
  const now = Date.now();

  return {
    id: createId(),
    text,
    dueDate,
    priority: "Medium",
    status: "Not Started",
    categoryId,
    note: "",
    createdAt: now,
    updatedAt: now,
  };
}

function TaskTrackerContent() {
  const { todayYmd } = useLocalToday();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [settings, setSettings] = useState<TaskTrackerSettings>(() =>
    normalizeTaskTrackerSettings({}),
  );
  const [tasksState, setTasksState] = useState<TaskTrackerTasks>(() =>
    normalizeTaskTrackerTasks({}, settings.categories),
  );
  const [filters, setFilters] = useState<TaskTrackerFiltersState>(() => ({
    priority: "All",
    status: "All",
    categoryId: "All",
  }));
  const [selectedDate, setSelectedDate] = useState(todayYmd);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const highlightedTaskId = searchParams.get("taskId");

  useEffect(() => {
    setSelectedDate(todayYmd);
  }, [todayYmd]);

  const debouncedSave = useMemo(
    () =>
      debounce((nextTasks: TaskTrackerTasks, nextSettings: TaskTrackerSettings) => {
        if (!user) {
          return;
        }

        void saveTaskTracker(user.uid, nextTasks, nextSettings);
      }, 900),
    [user],
  );

  const debouncedSaveFilters = useMemo(
    () =>
      debounce((nextFilters: TaskTrackerFiltersState) => {
        if (!user) {
          return;
        }

        saveTaskFilters(user.uid, nextFilters as unknown as Record<string, string>);
      }, 900),
    [user],
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    const cachedFilters = readTaskFilters(user.uid) as TaskTrackerFiltersState | null;
    if (cachedFilters) {
      setFilters(cachedFilters);
    }

    const cached = readCachedTaskTracker(user.uid);
    const fallbackSettings = cached.settings ?? normalizeTaskTrackerSettings({});
    const fallbackTasks =
      cached.tasks ?? normalizeTaskTrackerTasks({}, fallbackSettings.categories);

    setSettings(fallbackSettings);
    setTasksState(fallbackTasks);
    setIsHydrated(true);

    let active = true;

    const load = async () => {
      const data = await loadTaskTracker(user.uid);

      if (!active) {
        return;
      }

      setSettings(data.settings);
      setTasksState(data.tasks);
      setIsHydrated(true);
    };

    void load();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !isHydrated) {
      return;
    }

    debouncedSave(tasksState, settings);

    return () => {
      debouncedSave.cancel();
    };
  }, [tasksState, settings, debouncedSave, user, isHydrated]);

  useEffect(() => {
    if (!user) {
      return;
    }

    debouncedSaveFilters(filters);

    return () => {
      debouncedSaveFilters.cancel();
    };
  }, [filters, debouncedSaveFilters, user]);

  useSaveOnBlur(() => {
    debouncedSave.flush();
    debouncedSaveFilters.flush();
  });

  const counters = useMemo(
    () => getTaskCounters(tasksState.tasks, selectedDate),
    [tasksState.tasks, selectedDate],
  );

  const progressPercent = useMemo(
    () => getProgressPercent(getTasksForDate(tasksState.tasks, selectedDate)),
    [tasksState.tasks, selectedDate],
  );

  const filteredTasks = useMemo(() => {
    return tasksState.tasks.filter((task) => {
      const matchesPriority =
        !filters.priority || filters.priority === "All" || task.priority === filters.priority;
      const matchesStatus =
        !filters.status || filters.status === "All" || task.status === filters.status;
      const matchesCategory =
        !filters.categoryId ||
        filters.categoryId === "All" ||
        task.categoryId === filters.categoryId;

      return matchesPriority && matchesStatus && matchesCategory;
    });
  }, [tasksState.tasks, filters.priority, filters.status, filters.categoryId]);

  const addTask = (text: string) => {
    const task = createTask(text, selectedDate, settings.categories[0]?.id);

    setTasksState((previous) => ({
      ...previous,
      tasks: [...previous.tasks, task],
    }));
  };

  const toggleDone = (taskId: string, checked: boolean) => {
    setTasksState((previous) => ({
      ...previous,
      tasks: previous.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: checked ? "Done" : "Not Started",
              updatedAt: Date.now(),
            }
          : task,
      ),
    }));
  };

  const updateTask = (taskId: string, patch: Partial<Task>) => {
    setTasksState((previous) => ({
      ...previous,
      tasks: previous.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...patch,
              updatedAt: Date.now(),
            }
          : task,
      ),
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasksState((previous) => ({
      ...previous,
      tasks: previous.tasks.filter((task) => task.id !== taskId),
    }));
  };

  const addCategory = (name: string) => {
    setSettings((previous) => ({
      ...previous,
      categories: [
        ...previous.categories,
        {
          id: createId(),
          name,
        },
      ],
    }));
  };

  const updateCategory = (categoryId: string, name: string) => {
    setSettings((previous) => ({
      ...previous,
      categories: previous.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              name,
            }
          : category,
      ),
    }));
  };

  const deleteCategory = (categoryId: string) => {
    setSettings((previous) => ({
      ...previous,
      categories: previous.categories.filter((category) => category.id !== categoryId),
    }));

    const updatedTasks = {
      tasks: tasksState.tasks.map((task) =>
        task.categoryId === categoryId
          ? {
              ...task,
              categoryId: undefined,
              updatedAt: Date.now(),
            }
          : task,
      ),
    };
    setTasksState(updatedTasks);
  };

  const clearFilters = () => {
    setFilters({
      priority: "All",
      status: "All",
      categoryId: "All",
    });
  };

  return (
    <PageShell
      title="Task Tracker"
      subtitle="Manage tasks and apply filters."
      rightAction={
        <Button variant="glass-outline" onClick={() => setIsSettingsOpen(true)}>
          Settings
        </Button>
      }
    >
      <SectionCard>
        <TopBar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          counters={counters}
          progressPercent={progressPercent}
          progressLabel={`${progressPercent}%`}
        />

        <div className="mt-4">
          <FiltersPanels
            categories={settings.categories}
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />
        </div>

        <div className="mt-4">
          <TaskTable
            tasks={filteredTasks}
            categories={settings.categories}
            selectedDate={selectedDate}
            highlightedTaskId={highlightedTaskId}
            onAddTask={addTask}
            onToggleDone={toggleDone}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        </div>
      </SectionCard>

      <GlassModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Task Tracker Settings"
        className="max-w-5xl"
      >
        <SettingsPanel
          categories={settings.categories}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
        />
      </GlassModal>
    </PageShell>
  );
}

export default function TaskTrackerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pb-10">
          <main className="mx-auto w-full max-w-400 px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
            <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-center text-sm text-white/60">
              Loading task tracker...
            </div>
          </main>
        </div>
      }
    >
      <TaskTrackerContent />
    </Suspense>
  );
}
