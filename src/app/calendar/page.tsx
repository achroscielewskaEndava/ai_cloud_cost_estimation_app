"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { CalendarGrid } from "@/app/calendar/components/calendar-grid";
import { MonthNavigator } from "@/components/calendar/month-navigator";
import { TodoSidebar } from "@/app/calendar/components/to-do-sidebar";
import { Button } from "@/components/ui/button";
import { syncCompletionsWithTasks } from "@/lib/calendarData";
import { usePredefinedTasks } from "@/app/calendar/hooks/usePredefinedTasks";
import { useCompletions } from "@/app/calendar/hooks/useCompletions";

const now = new Date();

export default function Calendar() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const {
    loadPredefinedTasks,
    allPredefinedTasks,
    loadingTasksByMonth,
    taskErrorsByMonth,
  } = usePredefinedTasks();

  const monthKey = `${year}-${month}`;
  const monthTasks = useMemo(
    () => allPredefinedTasks[monthKey] ?? [],
    [allPredefinedTasks, monthKey],
  );

  const {
    allCompletions,
    setAllCompletions,
    loadingCompletionsByMonth,
    loadCompletions,
    saveCompletions,
    savingCompletionsByMonth,
    dirtyCompletionsByMonth,
    setDirtyCompletionsByMonth,
    completionErrorsByMonth,
  } = useCompletions();

  const monthCompletions =
    allCompletions[monthKey] ??
    syncCompletionsWithTasks(year, month, monthTasks);

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
    [
      month,
      monthKey,
      monthTasks,
      setAllCompletions,
      setDirtyCompletionsByMonth,
      year,
    ],
  );

  const handleSaveCompletions = () => {
    const current =
      allCompletions[monthKey] ??
      syncCompletionsWithTasks(year, month, monthTasks);

    saveCompletions(year, month, monthKey, current).catch((error) => {
      console.error(error);
    });
  };

  useEffect(() => {
    if (allPredefinedTasks[monthKey] || loadingTasksByMonth[monthKey]) return;

    loadPredefinedTasks(year, month, monthKey);
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

    loadCompletions(allPredefinedTasks, year, month, monthKey);
  }, [
    allCompletions,
    allPredefinedTasks,
    loadCompletions,
    loadingCompletionsByMonth,
    month,
    monthKey,
    year,
  ]);

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
              <TodoSidebar year={year} month={month} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
