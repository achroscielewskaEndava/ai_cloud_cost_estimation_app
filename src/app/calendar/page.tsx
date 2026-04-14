"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { CalendarGrid } from "@/app/calendar/components/calendar-grid";
import { MonthNavigator } from "@/components/calendar/month-navigator";
import { TodoSidebar } from "@/app/calendar/components/to-do-sidebar";
import { Button } from "@/components/ui/button";
import {
  syncCompletionsWithTasks,
  type CompletionMap,
  type MonthlyTask,
  type PredefinedTask,
} from "@/lib/calendarData";
import { useTodos } from "@/app/calendar/hooks/useTodos";

const now = new Date();

export default function Calendar() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [allCompletions, setAllCompletions] = useState<
    Record<string, CompletionMap>
  >({});
  const [allPredefinedTasks, setAllPredefinedTasks] = useState<
    Record<string, PredefinedTask[]>
  >({});
  const [loadingTasksByMonth, setLoadingTasksByMonth] = useState<
    Record<string, boolean>
  >({});
  const [taskErrorsByMonth, setTaskErrorsByMonth] = useState<
    Record<string, string | null>
  >({});
  const [loadingCompletionsByMonth, setLoadingCompletionsByMonth] = useState<
    Record<string, boolean>
  >({});
  const [savingCompletionsByMonth, setSavingCompletionsByMonth] = useState<
    Record<string, boolean>
  >({});
  const [dirtyCompletionsByMonth, setDirtyCompletionsByMonth] = useState<
    Record<string, boolean>
  >({});
  const [completionErrorsByMonth, setCompletionErrorsByMonth] = useState<
    Record<string, string | null>
  >({});

  const monthKey = `${year}-${month}`;
  const monthTasks = useMemo(
    () => allPredefinedTasks[monthKey] ?? [],
    [allPredefinedTasks, monthKey],
  );
  const monthCompletions =
    allCompletions[monthKey] ??
    syncCompletionsWithTasks(year, month, monthTasks);

  const { allTodos, loadingTodosByMonth, loadTodos, updateTodos } = useTodos();

  const saveCompletions = useCallback(
    async (
      targetYear: number,
      targetMonth: number,
      targetMonthKey: string,
      completions: CompletionMap,
    ) => {
      setSavingCompletionsByMonth((prev) => ({
        ...prev,
        [targetMonthKey]: true,
      }));
      setCompletionErrorsByMonth((prev) => ({
        ...prev,
        [targetMonthKey]: null,
      }));

      const response = await fetch("/api/calendar-completions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: targetYear,
          month: targetMonth,
          completions,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        const message =
          errorPayload?.error ??
          `Failed to save completions (${response.status})`;

        setCompletionErrorsByMonth((prev) => ({
          ...prev,
          [targetMonthKey]: message,
        }));

        setSavingCompletionsByMonth((prev) => ({
          ...prev,
          [targetMonthKey]: false,
        }));

        throw new Error(message);
      }

      setDirtyCompletionsByMonth((prev) => ({
        ...prev,
        [targetMonthKey]: false,
      }));
      setSavingCompletionsByMonth((prev) => ({
        ...prev,
        [targetMonthKey]: false,
      }));
    },
    [],
  );

  const loadPredefinedTasks = useCallback(
    async (targetYear: number, targetMonth: number, targetMonthKey: string) => {
      setLoadingTasksByMonth((prev) => ({ ...prev, [targetMonthKey]: true }));
      setTaskErrorsByMonth((prev) => ({ ...prev, [targetMonthKey]: null }));

      try {
        const response = await fetch(
          `/api/calendar-predefined-tasks?year=${targetYear}&month=${targetMonth}`,
        );

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            errorPayload?.error ??
              `Failed to load predefined tasks (${response.status})`,
          );
        }

        const payload = (await response.json()) as { data?: PredefinedTask[] };
        const loadedTasks = Array.isArray(payload.data) ? payload.data : [];

        setAllPredefinedTasks((prev) => ({
          ...prev,
          [targetMonthKey]: loadedTasks,
        }));
        setAllCompletions((prev) => {
          const existingMonth = prev[targetMonthKey];

          if (!existingMonth) {
            return prev;
          }

          return {
            ...prev,
            [targetMonthKey]: syncCompletionsWithTasks(
              targetYear,
              targetMonth,
              loadedTasks,
              existingMonth,
            ),
          };
        });
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load predefined tasks";

        setTaskErrorsByMonth((prev) => ({
          ...prev,
          [targetMonthKey]: message,
        }));
      } finally {
        setLoadingTasksByMonth((prev) => ({
          ...prev,
          [targetMonthKey]: false,
        }));
      }
    },
    [],
  );

  const loadCompletions = useCallback(
    async (targetYear: number, targetMonth: number, targetMonthKey: string) => {
      setLoadingCompletionsByMonth((prev) => ({
        ...prev,
        [targetMonthKey]: true,
      }));

      try {
        const response = await fetch(
          `/api/calendar-completions?year=${targetYear}&month=${targetMonth}`,
        );

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;

          throw new Error(
            errorPayload?.error ??
              `Failed to load completions (${response.status})`,
          );
        }

        const payload = (await response.json()) as { data?: CompletionMap };
        const loadedCompletions =
          payload.data && typeof payload.data === "object" ? payload.data : {};

        setAllCompletions((prev) => ({
          ...prev,
          [targetMonthKey]: syncCompletionsWithTasks(
            targetYear,
            targetMonth,
            allPredefinedTasks[targetMonthKey] ?? [],
            loadedCompletions,
          ),
        }));
        setDirtyCompletionsByMonth((prev) => ({
          ...prev,
          [targetMonthKey]: false,
        }));
      } catch (loadError) {
        console.error(loadError);
      } finally {
        setLoadingCompletionsByMonth((prev) => ({
          ...prev,
          [targetMonthKey]: false,
        }));
      }
    },
    [allPredefinedTasks],
  );

  const toggleCell = useCallback(
    (dateKey: string, taskId: string) => {
      setAllCompletions((prev) => {
        const monthData = {
          ...(prev[monthKey] ??
            syncCompletionsWithTasks(year, month, monthTasks)),
        };
        const dayData = { ...(monthData[dateKey] || {}) };
        dayData[taskId] = !dayData[taskId];
        monthData[dateKey] = dayData;
        return { ...prev, [monthKey]: monthData };
      });

      setDirtyCompletionsByMonth((prev) => ({ ...prev, [monthKey]: true }));
    },
    [month, monthKey, monthTasks, year],
  );

  const handleSaveCompletions = useCallback(() => {
    const current =
      allCompletions[monthKey] ??
      syncCompletionsWithTasks(year, month, monthTasks);

    void saveCompletions(year, month, monthKey, current).catch((error) => {
      console.error(error);
    });
  }, [allCompletions, month, monthKey, monthTasks, saveCompletions, year]);

  useEffect(() => {
    if (allPredefinedTasks[monthKey] || loadingTasksByMonth[monthKey]) return;

    void loadPredefinedTasks(year, month, monthKey);
  }, [
    allPredefinedTasks,
    loadPredefinedTasks,
    loadingTasksByMonth,
    month,
    monthKey,
    year,
  ]);

  useEffect(() => {
    if (!allPredefinedTasks[monthKey]) return;
    if (allCompletions[monthKey] || loadingCompletionsByMonth[monthKey]) return;

    void loadCompletions(year, month, monthKey);
  }, [
    allCompletions,
    allPredefinedTasks,
    loadCompletions,
    loadingCompletionsByMonth,
    month,
    monthKey,
    year,
  ]);

  useEffect(() => {
    if (allTodos[monthKey] || loadingTodosByMonth[monthKey]) return;

    const handleLoadTodos = async () => {
      await loadTodos(year, month, monthKey);
    };

    void handleLoadTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTodos, loadingTodosByMonth, month, monthKey, year]);

  const handleUpdateTodos = async (updated: MonthlyTask[]) => {
    await updateTodos(updated, year, month, monthKey);
  };

  const navigate = (dir: -1 | 1) => {
    setMonth((prev) => {
      const next = prev + dir;
      if (next < 0) {
        setYear((y) => y - 1);
        return 11;
      }
      if (next > 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return next;
    });
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-foreground"></span>
          <div className="flex items-center gap-2">
            <MonthNavigator
              year={year}
              month={month}
              onPrev={() => navigate(-1)}
              onNext={() => navigate(1)}
              onToday={goToday}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleSaveCompletions}
              disabled={
                savingCompletionsByMonth[monthKey] ||
                !dirtyCompletionsByMonth[monthKey]
              }
              className="text-xs px-2"
            >
              {savingCompletionsByMonth[monthKey] ? "Saving..." : "Save"}
            </Button>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            {taskErrorsByMonth[monthKey] ? (
              <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {taskErrorsByMonth[monthKey]}
              </div>
            ) : null}
            <CalendarGrid
              year={year}
              month={month}
              tasks={monthTasks}
              completions={monthCompletions}
              onToggle={toggleCell}
            />
            {loadingTasksByMonth[monthKey] ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Loading predefined tasks...
              </p>
            ) : null}
            {completionErrorsByMonth[monthKey] ? (
              <p className="mt-2 text-sm text-destructive">
                {completionErrorsByMonth[monthKey]}
              </p>
            ) : null}
          </div>
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-18">
              <TodoSidebar
                tasks={allTodos[monthKey] ?? []}
                onUpdate={handleUpdateTodos}
                monthLabel={`${month + 1} / ${year}`}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
