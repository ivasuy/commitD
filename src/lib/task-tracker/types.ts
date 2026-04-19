export const PRIORITIES = ["High", "Medium", "Low", "Optional"] as const;
export const STATUSES = [
  "Done",
  "In Progress",
  "Not Started",
  "Canceled",
] as const;

export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];

export interface Category {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  text: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  categoryId?: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TaskTrackerSettings {
  categories: Category[];
}

export interface TaskTrackerTasks {
  tasks: Task[];
}

export interface TaskTrackerCounters {
  today: number;
  totalTasks: number;
  overdue: number;
  notCompleted: number;
  completed: number;
}

export interface DistributionSlice {
  key: string;
  label: string;
  count: number;
  color: string;
}

export interface TaskTrackerFiltersState {
  priority: Priority | "All";
  status: Status | "All";
  categoryId: string | "All";
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  High: "#de3b35",
  Medium: "#f4cf1c",
  Low: "#1d7ae6",
  Optional: "#d7d7d7",
};

export const STATUS_COLORS: Record<Status, string> = {
  Done: "#62b767",
  "In Progress": "#e9bf80",
  "Not Started": "#f4da87",
  Canceled: "#d89c9c",
};

export const STATUS_ICONS: Record<Status, string> = {
  Done: "✅",
  "In Progress": "✏️",
  "Not Started": "⚠️",
  Canceled: "❌",
};
