"use client";

import { Button } from "@/src/components/ui/button";
import { PRIORITIES, STATUSES, type Category, type TaskTrackerFiltersState } from "@/src/lib/task-tracker/types";

interface FiltersPanelsProps {
  categories: Category[];
  filters: TaskTrackerFiltersState;
  onFiltersChange: (nextFilters: TaskTrackerFiltersState) => void;
  onClearFilters: () => void;
}

export default function FiltersPanels({
  categories,
  filters,
  onFiltersChange,
  onClearFilters,
}: FiltersPanelsProps) {
  const labelClass = "text-xs font-semibold uppercase tracking-[0.18em] text-white/50";
  const selectClass =
    "mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23ffffff%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8";
  const hasActiveFilters =
    filters.priority !== "All" ||
    filters.status !== "All" ||
    filters.categoryId !== "All";

  return (
    <div className="grid gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-end">
      <div>
        <label className={labelClass} htmlFor="priority-filter">
          Priority
        </label>
        <select
          id="priority-filter"
          value={filters.priority}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              priority: event.target.value as TaskTrackerFiltersState["priority"],
            })
          }
          className={selectClass}
        >
          <option value="All">All</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="status-filter">
          Status
        </label>
        <select
          id="status-filter"
          value={filters.status}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              status: event.target.value as TaskTrackerFiltersState["status"],
            })
          }
          className={selectClass}
        >
          <option value="All">All</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="category-filter">
          Category
        </label>
        <select
          id="category-filter"
          value={filters.categoryId}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              categoryId: event.target.value,
            })
          }
          className={selectClass}
        >
          <option value="All">All</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="button"
        variant="default"
        onClick={onClearFilters}
        disabled={!hasActiveFilters}
        className="h-10 whitespace-nowrap"
      >
        Clear filters
      </Button>
    </div>
  );
}
