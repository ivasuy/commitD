import { PRIORITIES, PRIORITY_COLORS, STATUSES, STATUS_ICONS, type Category, type Priority, type Status, type Task } from "@/src/lib/task-tracker/types";
import { isBeforeLocal, isSameLocalDay } from "@/src/lib/time/localTime";

interface TaskRowProps {
  task: Task;
  categories: Category[];
  selectedDate: string;
  highlighted: boolean;
  onToggleDone: (taskId: string, checked: boolean) => void;
  onUpdateTask: (taskId: string, patch: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  variant?: "table" | "card";
}

function dueDateTone(task: Task, selectedDate: string): string {
  if (task.status !== "Done" && isBeforeLocal(task.dueDate, selectedDate)) {
    return "bg-red-500/15";
  }

  if (isSameLocalDay(task.dueDate, selectedDate)) {
    return "bg-emerald-500/15";
  }

  if (isBeforeLocal(selectedDate, task.dueDate)) {
    return "bg-emerald-500/10";
  }

  return "";
}

const inputCellClass = "w-full min-w-0 bg-transparent text-sm text-white/90 outline-none placeholder:text-white/50";
const selectCellClass = "w-full min-w-0 bg-transparent text-sm text-white/90 outline-none placeholder:text-white/50 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23ffffff%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_0.5rem_center] bg-no-repeat pr-7";
const dateInputClass = `${inputCellClass} pr-8`;

export default function TaskRow({
  task,
  categories,
  selectedDate,
  highlighted,
  onToggleDone,
  onUpdateTask,
  onDeleteTask,
  variant = "table",
}: TaskRowProps) {
  const rowClasses = highlighted
    ? "bg-emerald-500/10 ring-2 ring-inset ring-emerald-400"
    : "even:bg-white/5";

  const mobileSelectClass = "w-full rounded border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23ffffff%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8";
  const mobileInputClass = "w-full rounded border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20";

  if (variant === "card") {
    const cardClasses = highlighted
      ? "rounded-xl border border-emerald-400 bg-emerald-500/10 p-3 space-y-3"
      : "rounded-xl border border-white/15 bg-white/5 p-3 space-y-3";

    return (
      <div id={`task-row-${task.id}`} className={cardClasses}>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.status === "Done"}
            onChange={(event) => onToggleDone(task.id, event.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 rounded border-white/30 accent-[#86efac] focus:ring-white/40"
            aria-label={`Mark ${task.text} done`}
          />
          <input
            value={task.text}
            onChange={(event) => onUpdateTask(task.id, { text: event.target.value })}
            className={`flex-1 bg-transparent text-sm font-medium text-white/90 outline-none ${
              task.status === "Done" ? "text-white/60 line-through" : ""
            }`}
            aria-label="Task text"
          />
          <button
            type="button"
            onClick={() => onDeleteTask(task.id)}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-300/25 bg-red-500/10 text-base leading-none text-red-100 transition hover:border-red-300/45 hover:bg-red-500/20"
            aria-label={`Delete ${task.text}`}
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Due Date</label>
            <div className={dueDateTone(task, selectedDate) + " rounded"}>
              <input
                type="date"
                value={task.dueDate}
                onChange={(event) => onUpdateTask(task.id, { dueDate: event.target.value })}
                className={mobileInputClass}
                style={{ colorScheme: "dark" }}
                aria-label="Due date"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Priority</label>
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-4 shrink-0 rounded-full border border-white/20"
                style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
              />
              <select
                value={task.priority}
                onChange={(event) => onUpdateTask(task.id, { priority: event.target.value as Priority })}
                className={mobileSelectClass}
                aria-label="Priority"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Status</label>
            <div className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-center">{STATUS_ICONS[task.status]}</span>
              <select
                value={task.status}
                onChange={(event) => onUpdateTask(task.id, { status: event.target.value as Status })}
                className={mobileSelectClass}
                aria-label="Status"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Category</label>
            <select
              value={task.categoryId ?? ""}
              onChange={(event) =>
                onUpdateTask(task.id, {
                  categoryId: event.target.value || undefined,
                })
              }
              className={mobileSelectClass}
              aria-label="Category"
            >
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Note</label>
          <input
            value={task.note ?? ""}
            onChange={(event) => onUpdateTask(task.id, { note: event.target.value })}
            className={mobileInputClass}
            placeholder="Add a note..."
            aria-label="Task note"
          />
        </div>
      </div>
    );
  }

  return (
    <tr id={`task-row-${task.id}`} className={rowClasses + " border-b border-white/10"}>
      <td className="border-r border-white/10 px-2 py-1.5 text-center">
        <input
          type="checkbox"
          checked={task.status === "Done"}
          onChange={(event) => onToggleDone(task.id, event.target.checked)}
          className="h-4 w-4 rounded border-white/30 accent-[#86efac] focus:ring-white/40"
          aria-label={`Mark ${task.text} done`}
        />
      </td>

      <td className="border-r border-white/10 px-2 py-1.5">
        <input
          value={task.text}
          onChange={(event) => onUpdateTask(task.id, { text: event.target.value })}
          className={`w-full bg-transparent px-1 text-sm text-white/90 outline-none ${
            task.status === "Done" ? "text-white/60 line-through" : ""
          }`}
          aria-label="Task text"
        />
      </td>

      <td
        className={`border-r border-white/10 px-2 py-1.5 min-w-[140px] ${dueDateTone(task, selectedDate)}`}
      >
        <input
          type="date"
          value={task.dueDate}
          onChange={(event) => onUpdateTask(task.id, { dueDate: event.target.value })}
          className={dateInputClass}
          style={{ colorScheme: "dark" }}
          aria-label="Due date"
        />
      </td>

      <td className="border-r border-white/10 px-2 py-1.5">
        <div className="flex items-center gap-1">
          <span
            className="h-4 w-4 shrink-0 rounded-full border border-white/20"
            style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
          />
          <select
            value={task.priority}
            onChange={(event) => onUpdateTask(task.id, { priority: event.target.value as Priority })}
            className={selectCellClass}
            aria-label="Priority"
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </td>

      <td className="border-r border-white/10 px-2 py-1.5">
        <div className="flex items-center gap-1">
          <span className="w-4 shrink-0 text-center">{STATUS_ICONS[task.status]}</span>
          <select
            value={task.status}
            onChange={(event) => onUpdateTask(task.id, { status: event.target.value as Status })}
            className={selectCellClass}
            aria-label="Status"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </td>

      <td className="border-r border-white/10 px-2 py-1.5">
        <select
          value={task.categoryId ?? ""}
          onChange={(event) =>
            onUpdateTask(task.id, {
              categoryId: event.target.value || undefined,
            })
          }
          className={selectCellClass}
          aria-label="Category"
        >
          <option value="">None</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </td>

      <td className="px-2 py-1.5">
        <input
          value={task.note ?? ""}
          onChange={(event) => onUpdateTask(task.id, { note: event.target.value })}
          className={inputCellClass}
          placeholder="Note"
          aria-label="Task note"
        />
      </td>

      <td className="px-2 py-1.5 text-center">
        <button
          type="button"
          onClick={() => onDeleteTask(task.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-300/25 bg-red-500/10 text-lg leading-none text-red-100 transition hover:border-red-300/45 hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50"
          aria-label={`Delete ${task.text}`}
        >
          ×
        </button>
      </td>
    </tr>
  );
}
