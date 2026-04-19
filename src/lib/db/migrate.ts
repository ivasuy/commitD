import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";

import { firestore } from "@/src/lib/firebase/client";
import { canUseStorage, listStorageKeys, readRawStorageItem } from "@/src/lib/storage";
import { loadWeekData } from "@/src/lib/weekly-planner/storage";
import { fromYearMonthKey, getDaysInMonth } from "@/src/lib/date";
import { loadHabitMonthState } from "@/src/lib/habit-tracker/storage";
import {
  loadTaskTrackerSettings,
  loadTaskTrackerTasks,
} from "@/src/lib/task-tracker/storage";
import {
  loadFinanceMonthStateIfExists,
  loadFinanceSettings,
} from "@/src/lib/finance-tracker/storage";
import { parseMonthKey } from "@/src/lib/finance-tracker/date";

const WEEK_PREFIX = "weekly-planner:week:";
const HABIT_PREFIX = "habit-tracker:";
const FINANCE_PREFIX = "finance-tracker:";

async function commitIfNeeded(
  batch: ReturnType<typeof writeBatch>,
  writes: number,
): Promise<number> {
  if (writes < 450) {
    return writes;
  }

  await batch.commit();
  return 0;
}

export async function migrateLocalStorageToFirestore(uid: string): Promise<void> {
  if (!canUseStorage()) {
    return;
  }

  const migrationRef = doc(firestore, "users", uid, "meta", "migration");
  const migrationSnap = await getDoc(migrationRef);

  if (migrationSnap.exists() && migrationSnap.data()?.completed) {
    return;
  }

  let batch = writeBatch(firestore);
  let writes = 0;

  const weeklyKeys = listStorageKeys(WEEK_PREFIX);
  for (const key of weeklyKeys) {
    const weekStart = key.replace(WEEK_PREFIX, "");
    if (!weekStart) {
      continue;
    }

    const data = loadWeekData(weekStart, weekStart);
    batch.set(
      doc(firestore, "users", uid, "weeklyPlanner", weekStart),
      {
        weekStart,
        quote: data.quote,
        tasksByDay: data.tasksByDay,
        recurringTasks: data.recurringTasks,
        notesByDay: data.notesByDay,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    writes += 1;
    writes = await commitIfNeeded(batch, writes);
    if (writes === 0) {
      batch = writeBatch(firestore);
    }
  }

  const habitKeys = listStorageKeys(HABIT_PREFIX)
    .filter((key) => key.startsWith(HABIT_PREFIX))
    .map((key) => key.replace(HABIT_PREFIX, ""))
    .filter((key) => /^\d{4}-\d{2}$/.test(key));

  for (const monthKey of habitKeys) {
    const parsed = fromYearMonthKey(monthKey);
    if (!parsed) {
      continue;
    }

    const state = loadHabitMonthState(
      parsed.year,
      parsed.monthIndex,
      getDaysInMonth(parsed.year, parsed.monthIndex),
    );

    batch.set(
      doc(firestore, "users", uid, "habitTracker", monthKey),
      {
        monthKey,
        habits: state.habits,
        checksByHabitId: state.checksByHabitId,
        mood: state.mood,
        motivation: state.motivation,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    writes += 1;
    writes = await commitIfNeeded(batch, writes);
    if (writes === 0) {
      batch = writeBatch(firestore);
    }
  }

  if (readRawStorageItem("task-tracker:settings") !== null) {
    const settings = loadTaskTrackerSettings();
    batch.set(
      doc(firestore, "users", uid, "taskTracker", "meta"),
      {
        categories: settings.categories,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    writes += 1;
  }

  if (readRawStorageItem("task-tracker:tasks") !== null) {
    const tasks = loadTaskTrackerTasks();
    batch.set(
      doc(firestore, "users", uid, "taskTracker", "data"),
      {
        tasks: tasks.tasks,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    writes += 1;
  }

  const financeSettingsRaw = readRawStorageItem("finance-tracker:settings");
  if (financeSettingsRaw !== null) {
    const settings = loadFinanceSettings();
    batch.set(
      doc(firestore, "users", uid, "financeTracker", "settings"),
      {
        incomeSources: settings.incomeSources,
        expenseCategories: settings.expenseCategories,
        debtSources: settings.debtSources,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    writes += 1;
  }

  const financeMonthKeys = listStorageKeys(FINANCE_PREFIX)
    .map((key) => key.replace(FINANCE_PREFIX, ""))
    .filter((key) => parseMonthKey(key));

  if (financeMonthKeys.length) {
    const settings = loadFinanceSettings();

    for (const monthKey of financeMonthKeys) {
      const state = loadFinanceMonthStateIfExists(monthKey, settings);

      if (!state) {
        continue;
      }

      batch.set(
        doc(firestore, "users", uid, "financeTracker", monthKey),
        {
          monthKey,
          startingAmount: state.startingAmount,
          plannedIncome: state.plannedIncome,
          plannedExpenses: state.plannedExpenses,
          debts: state.debts,
          dailyIncome: state.dailyIncome,
          dailyExpenses: state.dailyExpenses,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      writes += 1;
      writes = await commitIfNeeded(batch, writes);
      if (writes === 0) {
        batch = writeBatch(firestore);
      }
    }
  }

  batch.set(
    migrationRef,
    {
      completed: true,
      migratedAt: serverTimestamp(),
    },
    { merge: true },
  );
  writes += 1;

  await batch.commit();
}
