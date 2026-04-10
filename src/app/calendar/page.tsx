"use client";

import { useState, useCallback, useEffect } from "react";
import { CalendarGrid } from "@/app/calendar/components/calendar-grid";
import { MonthNavigator } from "@/components/calendar/month-navigator";
import { TodoSidebar } from "@/app/calendar/components/to-do-sidebar";
import {
  generateMockCompletions,
  type CompletionMap,
  type MonthlyTask,
} from "@/lib/calendarData";
import { useTodos } from "@/app/calendar/hooks/useTodos";

const now = new Date();

export default function Calendar() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [allCompletions, setAllCompletions] = useState<
    Record<string, CompletionMap>
  >(() => {
    const key = `${now.getFullYear()}-${now.getMonth()}`;
    return {
      [key]: generateMockCompletions(now.getFullYear(), now.getMonth()),
    };
  });

  const monthKey = `${year}-${month}`;

  const { allTodos, loadingTodosByMonth, loadTodos, updateTodos } = useTodos();

  const toggleCell = useCallback(
    (dateKey: string, taskId: string) => {
      setAllCompletions((prev) => {
        const monthData = { ...(prev[monthKey] || {}) };
        const dayData = { ...(monthData[dateKey] || {}) };
        dayData[taskId] = !dayData[taskId];
        monthData[dateKey] = dayData;
        return { ...prev, [monthKey]: monthData };
      });
    },
    [monthKey],
  );

  if (!allCompletions[monthKey]) {
    const mock = generateMockCompletions(year, month);
    setAllCompletions((prev) => ({ ...prev, [monthKey]: mock }));
  }

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
          <MonthNavigator
            year={year}
            month={month}
            onPrev={() => navigate(-1)}
            onNext={() => navigate(1)}
            onToday={goToday}
          />
          <div className="w-[80px]" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <CalendarGrid
              year={year}
              month={month}
              completions={allCompletions[monthKey]}
              onToggle={toggleCell}
            />
          </div>
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-[72px]">
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
