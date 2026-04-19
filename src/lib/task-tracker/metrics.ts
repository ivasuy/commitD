import { isBeforeISO, isSameISO } from "@/src/lib/task-tracker/date";
import {
  PRIORITIES,
  PRIORITY_COLORS,
  STATUSES,
  STATUS_COLORS,
  type Category,
  type DistributionSlice,
  type Priority,
  type Status,
  type Task,
  type TaskTrackerCounters,
} from "@/src/lib/task-tracker/types";

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    if (left.dueDate !== right.dueDate) {
      return left.dueDate.localeCompare(right.dueDate);
    }

    return left.createdAt - right.createdAt;
  });
}

export function getTaskCounters(tasks: Task[], selectedDate: string): TaskTrackerCounters {
  const today = tasks.filter((task) => isSameISO(task.dueDate, selectedDate)).length;
  const completed = tasks.filter((task) => task.status === "Done").length;
  const notCompleted = tasks.filter((task) => task.status !== "Done").length;
  const overdue = tasks.filter(
    (task) => task.status !== "Done" && isBeforeISO(task.dueDate, selectedDate),
  ).length;

  return {
    today,
    totalTasks: tasks.length,
    overdue,
    notCompleted,
    completed,
  };
}

export function getProgressPercent(tasks: Task[]): number {
  if (!tasks.length) {
    return 0;
  }

  const completed = tasks.filter((task) => task.status === "Done").length;
  return Math.round((completed / tasks.length) * 100);
}

export function getTasksForDate(tasks: Task[], selectedDate: string): Task[] {
  return sortTasks(tasks.filter((task) => isSameISO(task.dueDate, selectedDate)));
}

function toSlices<T extends string>(
  keys: readonly T[],
  labelFor: (key: T) => string,
  colorFor: (key: T) => string,
  countFor: (key: T) => number,
): DistributionSlice[] {
  return keys.map((key) => ({
    key,
    label: labelFor(key),
    count: countFor(key),
    color: colorFor(key),
  }));
}

export function getPriorityDistribution(tasks: Task[]): DistributionSlice[] {
  return toSlices(
    PRIORITIES,
    (priority) => priority,
    (priority) => PRIORITY_COLORS[priority],
    (priority) => tasks.filter((task) => task.priority === priority).length,
  );
}

export function getStatusDistribution(tasks: Task[]): DistributionSlice[] {
  return toSlices(
    STATUSES,
    (status) => status,
    (status) => STATUS_COLORS[status],
    (status) => tasks.filter((task) => task.status === status).length,
  );
}

const CATEGORY_COLORS = [
  "#9fc88f",
  "#90b6be",
  "#89a8d8",
  "#c6a0b7",
  "#eddc8b",
  "#bfc8df",
  "#c8c8c8",
  "#dda48b",
  "#8cb8a5",
];

export function getCategoryDistribution(
  tasks: Task[],
  categories: Category[],
): DistributionSlice[] {
  const categoryIds = new Set(categories.map((category) => category.id));
  const baseSlices = categories.map((category, index) => ({
    key: category.id,
    label: category.name,
    count: tasks.filter((task) => task.categoryId === category.id).length,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  const uncategorizedCount = tasks.filter(
    (task) => !task.categoryId || !categoryIds.has(task.categoryId),
  ).length;

  if (!baseSlices.length || uncategorizedCount > 0) {
    baseSlices.push({
      key: "uncategorized",
      label: "Uncategorized",
      count: uncategorizedCount,
      color: "#c8c8c8",
    });
  }

  return baseSlices;
}

export function filterTasksByPriority(tasks: Task[], priority: Priority | "All"): Task[] {
  if (priority === "All") {
    return sortTasks(tasks);
  }

  return sortTasks(tasks.filter((task) => task.priority === priority));
}

export function filterTasksByStatus(tasks: Task[], status: Status | "All"): Task[] {
  if (status === "All") {
    return sortTasks(tasks);
  }

  return sortTasks(tasks.filter((task) => task.status === status));
}

export function filterTasksByCategory(tasks: Task[], categoryId: string | "All"): Task[] {
  if (categoryId === "All") {
    return sortTasks(tasks);
  }

  return sortTasks(tasks.filter((task) => task.categoryId === categoryId));
}
