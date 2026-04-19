"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";

import TaskDistribution from "@/src/components/dashboard/TaskDistribution";
import SectionCard from "@/src/components/layout/SectionCard";
import { loadTaskTracker, readCachedTaskTracker } from "@/src/lib/db/store";
import {
  getCategoryDistribution,
  getPriorityDistribution,
  getStatusDistribution,
} from "@/src/lib/task-tracker/metrics";
import type { Category, DistributionSlice, Task } from "@/src/lib/task-tracker/types";

interface TaskAnalyticsSectionProps {
  uid: string | null;
}

type TaskAnalyticsView = "priority" | "status" | "category";

const VIEW_OPTIONS: Array<{
  value: TaskAnalyticsView;
  label: string;
  distributionTitle: string;
}> = [
  {
    value: "priority",
    label: "Priority",
    distributionTitle: "Priority distribution",
  },
  {
    value: "status",
    label: "Status",
    distributionTitle: "Status distribution",
  },
  {
    value: "category",
    label: "Category",
    distributionTitle: "Category distribution",
  },
];

const MAX_CATEGORY_BUCKETS = 6;
const OTHER_CATEGORY_COLOR = "#94a3b8";

function buildCategoryDistribution(
  tasks: Task[],
  categories: Category[],
): DistributionSlice[] {
  const rankedSlices = getCategoryDistribution(tasks, categories)
    .filter((slice) => slice.count > 0)
    .sort((left, right) => {
      if (left.count !== right.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label);
    });

  if (rankedSlices.length <= MAX_CATEGORY_BUCKETS) {
    return rankedSlices;
  }

  const topSlices = rankedSlices.slice(0, MAX_CATEGORY_BUCKETS);
  const otherCount = rankedSlices
    .slice(MAX_CATEGORY_BUCKETS)
    .reduce((sum, slice) => sum + slice.count, 0);

  if (otherCount > 0) {
    topSlices.push({
      key: "category-other",
      label: "Other",
      count: otherCount,
      color: OTHER_CATEGORY_COLOR,
    });
  }

  return topSlices;
}

export default function TaskAnalyticsSection({ uid }: TaskAnalyticsSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<TaskAnalyticsView>("priority");

  useEffect(() => {
    let ignore = false;

    void Promise.resolve().then(async () => {
      if (!uid) {
        if (!ignore) {
          setTasks([]);
          setCategories([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      const cached = readCachedTaskTracker(uid);

      if (!ignore) {
        setTasks(cached.tasks?.tasks ?? []);
        setCategories(cached.settings?.categories ?? []);
      }

      const loaded = await loadTaskTracker(uid);

      if (ignore) {
        return;
      }

      setTasks(loaded.tasks.tasks);
      setCategories(loaded.settings.categories);
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [uid]);

  const handleViewChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setView(event.target.value as TaskAnalyticsView);
  }, []);

  const priorityDistribution = useMemo(() => getPriorityDistribution(tasks), [tasks]);
  const statusDistribution = useMemo(() => getStatusDistribution(tasks), [tasks]);
  const categoryDistribution = useMemo(
    () => buildCategoryDistribution(tasks, categories),
    [tasks, categories],
  );
  const distributionsByView = useMemo<Record<TaskAnalyticsView, DistributionSlice[]>>(
    () => ({
      priority: priorityDistribution,
      status: statusDistribution,
      category: categoryDistribution,
    }),
    [priorityDistribution, statusDistribution, categoryDistribution],
  );
  const activeView = VIEW_OPTIONS.find((option) => option.value === view) ?? VIEW_OPTIONS[0];
  const activeDistribution = distributionsByView[activeView.value];
  const totalTasks = tasks.length;

  return (
    <SectionCard
      title="Task Analytics"
      className="h-full"
      actions={(
        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/65">
          <span>View</span>
          <select
            value={view}
            onChange={handleViewChange}
            className="min-w-38 rounded-lg border border-white/20 bg-black/30 px-2.5 py-1.5 text-sm normal-case tracking-normal text-white/90 outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/20"
            aria-label="Task analytics view"
          >
            {VIEW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#0b0f19] text-white">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
    >
      {isLoading ? (
        <div className="flex h-[320px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/65">
          Loading task analytics...
        </div>
      ) : (
        <TaskDistribution
          title={activeView.distributionTitle}
          slices={activeDistribution}
          totalTasks={totalTasks}
        />
      )}
    </SectionCard>
  );
}
