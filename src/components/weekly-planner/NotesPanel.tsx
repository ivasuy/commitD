import Input from "@/src/components/ui/Input";
import type { WeekDayInfo } from "@/src/lib/weekly-planner/date";
import type { DayIndex, NotesByDay } from "@/src/lib/weekly-planner/storage";

type NoteSection = "notes" | "improve" | "thanks";
type NoteLineIndex = number;

interface NotesPanelProps {
  weekDays: WeekDayInfo[];
  selectedDay: DayIndex;
  notesByDay: NotesByDay;
  onSelectDay: (dayIndex: DayIndex) => void;
  onUpdateLine: (
    dayIndex: DayIndex,
    section: NoteSection,
    lineIndex: NoteLineIndex,
    value: string,
  ) => void;
  onDeleteLine: (
    dayIndex: DayIndex,
    section: NoteSection,
    lineIndex: NoteLineIndex,
  ) => void;
  isDayEditable: (dayIndex: DayIndex) => boolean;
}

const sectionConfig: { key: NoteSection; title: string }[] = [
  { key: "notes", title: "Notes" },
  { key: "improve", title: "What can be improved?" },
  { key: "thanks", title: "Thanks" },
];

export default function NotesPanel({
  weekDays,
  selectedDay,
  notesByDay,
  onSelectDay,
  onUpdateLine,
  onDeleteLine,
  isDayEditable,
}: NotesPanelProps) {
  const selectedNotes = notesByDay[selectedDay];
  const editable = isDayEditable(selectedDay);

  return (
    <div className="w-full">
      <div className="mt-3 overflow-x-auto scrollbar-thin-dark pb-1">
        <div className="flex min-w-max gap-2">
          {weekDays.map((day) => (
            <button
              key={day.isoDate}
              type="button"
              onClick={() => onSelectDay(day.index)}
              className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                selectedDay === day.index
                  ? "border-emerald-500 bg-emerald-600/80 text-white"
                  : "border-white/20 bg-white/5 text-white/90 hover:bg-white/10"
              }`}
            >
              {day.weekdayShort}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {sectionConfig.map((section) => (
          <article
            key={section.key}
            className="overflow-hidden rounded-xl border border-white/15 bg-white/5"
          >
            <header className="bg-emerald-600/80 px-3 py-1.5 text-center text-lg font-semibold text-white">
              {section.title}
            </header>

            <div className="p-2">
              {selectedNotes[section.key].map((line, index) => (
                <div
                  key={`${section.key}-${index}`}
                  className="grid grid-cols-[1.5rem_1fr_1.5rem] items-center gap-1 border-b border-white/15 py-1 last:border-b-0"
                >
                  <span className="text-sm font-medium text-white/60">{index + 1}.</span>
                  <Input
                    value={line}
                    onChange={(event) =>
                      onUpdateLine(
                        selectedDay,
                        section.key,
                        index as NoteLineIndex,
                        event.target.value,
                      )
                    }
                    aria-label={`${section.title} line ${index + 1}`}
                    className="min-h-0 border-0 bg-transparent py-0 text-sm shadow-none focus:ring-0"
                    placeholder="Write here"
                    disabled={!editable}
                  />
                  <button
                    type="button"
                    onClick={() => onDeleteLine(selectedDay, section.key, index)}
                    aria-label={`Delete ${section.title} line ${index + 1}`}
                    className="h-5 w-5 rounded text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!editable}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
