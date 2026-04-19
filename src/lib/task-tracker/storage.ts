import { canUseStorage, debounce, readStorageJSON, writeStorageJSON } from "@/src/lib/storage";
import { addDaysISO, todayISODate } from "@/src/lib/task-tracker/date";
import type {
  Category,
  Priority,
  Status,
  Task,
  TaskTrackerFiltersState,
  TaskTrackerSettings,
  TaskTrackerTasks,
} from "@/src/lib/task-tracker/types";

export const TASK_TRACKER_SETTINGS_KEY = "task-tracker:settings";
export const TASK_TRACKER_TASKS_KEY = "task-tracker:tasks";
export const TASK_TRACKER_FILTERS_KEY = "task-tracker:last-filters";

const DEFAULT_CATEGORY_NAMES = [
  "Health",
  "Work",
  "Money",
  "Family",
  "Personal Growth",
  "Chores",
  "Ideas",
  "Leisure",
  "Spirituality",
];

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildDefaultCategories(): Category[] {
  return DEFAULT_CATEGORY_NAMES.map((name) => ({
    id: createId(),
    name,
  }));
}

function makeTask(
  text: string,
  dueDate: string,
  priority: Priority,
  status: Status,
  categoryId: string,
  note = "",
): Task {
  const now = Date.now();

  return {
    id: createId(),
    text,
    dueDate,
    priority,
    status,
    categoryId,
    note,
    createdAt: now,
    updatedAt: now,
  };
}

function buildDefaultTasks(categories: Category[]): Task[] {
  const today = todayISODate();
  const categoryIds = categories.map((category) => category.id);

  if (!categoryIds.length) {
    return [];
  }

  return [
    makeTask(
      "Analyze the market's report",
      today,
      "Medium",
      "In Progress",
      categoryIds[1],
    ),
    makeTask(
      "Set up website traffic",
      addDaysISO(today, 1),
      "Medium",
      "Not Started",
      categoryIds[1],
    ),
    makeTask(
      "Pay the targeting specialist",
      addDaysISO(today, 1),
      "Low",
      "Not Started",
      categoryIds[1],
    ),
    makeTask(
      "Organize personal finances",
      addDaysISO(today, 2),
      "High",
      "In Progress",
      categoryIds[2],
    ),
    makeTask(
      "Write 10 content ideas",
      addDaysISO(today, 2),
      "Medium",
      "In Progress",
      categoryIds[6],
    ),
    makeTask(
      "Finish the commercial proposal",
      addDaysISO(today, 3),
      "Low",
      "In Progress",
      categoryIds[1],
    ),
    makeTask(
      "Review subscriptions",
      addDaysISO(today, 4),
      "Optional",
      "Not Started",
      categoryIds[5],
    ),
    makeTask(
      "Organize the workspace",
      addDaysISO(today, 5),
      "Medium",
      "In Progress",
      categoryIds[5],
    ),
    makeTask(
      "Gym membership",
      addDaysISO(today, -1),
      "High",
      "Done",
      categoryIds[0],
    ),
  ];
}

function normalizeSettings(value: unknown): TaskTrackerSettings {
  if (!value || typeof value !== "object") {
    return {
      categories: buildDefaultCategories(),
    };
  }

  const source = value as Record<string, unknown>;
  const categoriesRaw = Array.isArray(source.categories) ? source.categories : [];

  const categories = categoriesRaw
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : createId();
      const name = typeof record.name === "string" ? record.name : "";

      if (!name.trim()) {
        return null;
      }

      return {
        id,
        name,
      } satisfies Category;
    })
    .filter((category): category is Category => category !== null);

  return {
    categories: categories.length ? categories : buildDefaultCategories(),
  };
}

function normalizeTasks(value: unknown, categories: Category[]): TaskTrackerTasks {
  if (!value || typeof value !== "object") {
    return {
      tasks: buildDefaultTasks(categories),
    };
  }

  const source = value as Record<string, unknown>;
  const tasksRaw = Array.isArray(source.tasks) ? source.tasks : [];

  const tasks = tasksRaw
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : createId();
      const text = typeof record.text === "string" ? record.text.trim() : "";
      const dueDate = typeof record.dueDate === "string" ? record.dueDate : todayISODate();

      if (!text) {
        return null;
      }

      const priority = (record.priority ?? "Medium") as Priority;
      const status = (record.status ?? "Not Started") as Status;
      const categoryId =
        typeof record.categoryId === "string" ? record.categoryId : categories[0]?.id;
      const normalizedTask: Task = {
        id,
        text,
        dueDate,
        priority,
        status,
        note: typeof record.note === "string" ? record.note : "",
        createdAt:
          typeof record.createdAt === "number" && Number.isFinite(record.createdAt)
            ? record.createdAt
            : Date.now(),
        updatedAt:
          typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt)
            ? record.updatedAt
            : Date.now(),
      };

      if (categoryId) {
        normalizedTask.categoryId = categoryId;
      }

      return normalizedTask;
    })
    .filter((task): task is Task => task !== null);

  return {
    tasks: tasks.length ? tasks : buildDefaultTasks(categories),
  };
}

export function normalizeTaskTrackerSettings(value: unknown): TaskTrackerSettings {
  return normalizeSettings(value);
}

export function normalizeTaskTrackerTasks(
  value: unknown,
  categories: Category[],
): TaskTrackerTasks {
  return normalizeTasks(value, categories);
}

export function loadTaskTrackerSettings(): TaskTrackerSettings {
  const raw = readStorageJSON<unknown | null>(TASK_TRACKER_SETTINGS_KEY, null);
  const settings = normalizeSettings(raw);

  if (raw === null) {
    writeStorageJSON(TASK_TRACKER_SETTINGS_KEY, settings);
  }

  return settings;
}

export function saveTaskTrackerSettings(settings: TaskTrackerSettings): void {
  writeStorageJSON(TASK_TRACKER_SETTINGS_KEY, settings);
}

export function loadTaskTrackerTasks(categories?: Category[]): TaskTrackerTasks {
  if (!canUseStorage()) {
    return {
      tasks: [],
    };
  }

  const safeCategories = categories ?? loadTaskTrackerSettings().categories;
  const raw = readStorageJSON<unknown | null>(TASK_TRACKER_TASKS_KEY, null);
  const tasks = normalizeTasks(raw, safeCategories);

  if (raw === null) {
    writeStorageJSON(TASK_TRACKER_TASKS_KEY, tasks);
  }

  return tasks;
}

export function saveTaskTrackerTasks(tasks: TaskTrackerTasks): void {
  writeStorageJSON(TASK_TRACKER_TASKS_KEY, tasks);
}

export const debouncedSaveSettings = debounce(saveTaskTrackerSettings, 300);
export const debouncedSaveTasks = debounce(saveTaskTrackerTasks, 300);

const DEFAULT_FILTERS: TaskTrackerFiltersState = {
  priority: "All",
  status: "All",
  categoryId: "All",
};

export function loadTaskTrackerFilters(): TaskTrackerFiltersState {
  const raw = readStorageJSON<unknown | null>(TASK_TRACKER_FILTERS_KEY, null);

  if (!raw || typeof raw !== "object") {
    return DEFAULT_FILTERS;
  }

  const source = raw as Record<string, unknown>;

  return {
    priority: typeof source.priority === "string" ? (source.priority as TaskTrackerFiltersState["priority"]) : "All",
    status: typeof source.status === "string" ? (source.status as TaskTrackerFiltersState["status"]) : "All",
    categoryId: typeof source.categoryId === "string" ? source.categoryId : "All",
  };
}

export function saveTaskTrackerFilters(filters: TaskTrackerFiltersState): void {
  writeStorageJSON(TASK_TRACKER_FILTERS_KEY, filters);
}

export const debouncedSaveFilters = debounce(saveTaskTrackerFilters, 300);
