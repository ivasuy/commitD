"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/src/components/ui/button";
import Input from "@/src/components/ui/Input";
import { TableBody, TableCell, TableHeader, TableHeaderCell, TableHeaderRow, TableRow } from "@/src/components/ui/TableShell";
import TaskRow from "@/src/components/task-tracker/TaskRow";
import { sortTasks } from "@/src/lib/task-tracker/metrics";
import type { Category, Task } from "@/src/lib/task-tracker/types";

interface TaskTableProps {
  tasks: Task[];
  categories: Category[];
  selectedDate: string;
  highlightedTaskId: string | null;
  onAddTask: (text: string) => void;
  onToggleDone: (taskId: string, checked: boolean) => void;
  onUpdateTask: (taskId: string, patch: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function TaskTable({
  tasks,
  categories,
  selectedDate,
  highlightedTaskId,
  onAddTask,
  onToggleDone,
  onUpdateTask,
  onDeleteTask,
}: TaskTableProps) {
  const [draftTask, setDraftTask] = useState("");

  const rows = useMemo(() => sortTasks(tasks), [tasks]);
  const shouldScroll = rows.length > 8;

  useEffect(() => {
    if (!highlightedTaskId) {
      return;
    }

    const row = document.getElementById(`task-row-${highlightedTaskId}`);

    if (!row) {
      return;
    }

    row.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [highlightedTaskId, rows]);

  const submitDraftTask = () => {
    const text = draftTask.trim();

    if (!text) {
      return;
    }

    onAddTask(text);
    setDraftTask("");
  };

  const handleDraftSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitDraftTask();
  };

  return (
    <div className="w-full">
      <form className="mb-3 flex items-center gap-2" onSubmit={handleDraftSubmit}>
        <Input
          value={draftTask}
          onChange={(event) => setDraftTask(event.target.value)}
          placeholder="Add task and press Enter"
          className="flex-1"
          aria-label="Add task"
        />
        <Button type="submit">
          Add
        </Button>
      </form>

      {/* Mobile Card View */}
      <div className="max-h-[70vh] space-y-3 overflow-y-auto scrollbar-thin-dark md:hidden">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-8 text-center text-sm text-white/60">
            No tasks for this date.
          </div>
        ) : (
          rows.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              categories={categories}
              selectedDate={selectedDate}
              highlighted={highlightedTaskId === task.id}
              onToggleDone={onToggleDone}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              variant="card"
            />
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div
        className={`hidden w-full overflow-x-auto scrollbar-thin-dark rounded-xl border border-white/15 bg-white/5 md:block ${
          shouldScroll ? "max-h-100 overflow-y-auto" : "overflow-y-visible"
        }`}
      >
        <table className="min-w-6xl w-full border-collapse text-sm">
          <TableHeader>
            <TableHeaderRow>
              <TableHeaderCell />
              <TableHeaderCell>Task</TableHeaderCell>
              <TableHeaderCell>Due Date</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Note</TableHeaderCell>
              <TableHeaderCell>Remove</TableHeaderCell>
            </TableHeaderRow>
          </TableHeader>

          <TableBody>
            {rows.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                categories={categories}
                selectedDate={selectedDate}
                highlighted={highlightedTaskId === task.id}
                onToggleDone={onToggleDone}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                variant="table"
              />
            ))}

            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="px-3 py-4 text-center text-sm text-white/60"
                >
                  No tasks for this date.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </table>
      </div>
    </div>
  );
}
