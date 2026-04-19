"use client";

import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import Input from "@/src/components/ui/Input";
import {
  PRIORITIES,
  PRIORITY_COLORS,
  STATUSES,
  STATUS_ICONS,
  type Category,
} from "@/src/lib/task-tracker/types";

interface SettingsPanelProps {
  categories: Category[];
  onAddCategory: (name: string) => void;
  onUpdateCategory: (categoryId: string, name: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export default function SettingsPanel({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: SettingsPanelProps) {
  const [draftCategory, setDraftCategory] = useState("");

  const addCategory = () => {
    const name = draftCategory.trim();

    if (!name) {
      return;
    }

    onAddCategory(name);
    setDraftCategory("");
  };

  return (
    <div className="h-[70vh] min-h-0 overflow-hidden">
      <div className="grid h-full min-h-0 gap-4 md:grid-cols-3">
        <section className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-white/5 p-3">
          <header className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            Categories
          </header>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center gap-2">
                  <Input
                    value={category.name}
                    onChange={(event) => onUpdateCategory(category.id, event.target.value)}
                    className="h-9 flex-1 py-1.5 text-sm"
                    aria-label="Category name"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onDeleteCategory(category.id)}
                    className="h-9 w-9 shrink-0 px-0"
                    aria-label="Delete category"
                  >
                    ×
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3">
            <Input
              value={draftCategory}
              onChange={(event) => setDraftCategory(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCategory();
                }
              }}
              placeholder="Add category"
              className="py-1.5 text-sm"
            />
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-white/5 p-3">
          <header className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            Priority
          </header>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <ul className="space-y-2">
              {PRIORITIES.map((priority) => (
                <li key={priority} className="flex items-center gap-2 text-sm text-white/90">
                  <span
                    className="h-5 w-5 rounded-full border border-white/20"
                    style={{ backgroundColor: PRIORITY_COLORS[priority] }}
                  />
                  {priority}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-white/5 p-3">
          <header className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            Status
          </header>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <ul className="space-y-2">
              {STATUSES.map((status) => (
                <li key={status} className="flex items-center gap-2 text-sm text-white/90">
                  <span className="inline-flex w-5 justify-center text-base leading-none">
                    {STATUS_ICONS[status]}
                  </span>
                  {status}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
