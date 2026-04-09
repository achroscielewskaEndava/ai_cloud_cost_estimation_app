import { MonthlyTask } from "@/lib/calendarData";
import { useState } from "react";

export function useTodos() {
  const [allTodos, setAllTodos] = useState<Record<string, MonthlyTask[]>>({});
  const [loadingTodosByMonth, setLoadingTodosByMonth] = useState<
    Record<string, boolean>
  >({});

  const loadTodos = async (year: number, month: number, monthKey: string) => {
    setLoadingTodosByMonth((prev) => ({ ...prev, [monthKey]: true }));

    try {
      const response = await fetch(
        `/api/calendar-todos?year=${year}&month=${month}`,
      );
      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorPayload?.error ?? `Failed to load todos: ${response.status}`,
        );
      }

      const payload = (await response.json()) as { data?: MonthlyTask[] };
      const todos = Array.isArray(payload.data) ? payload.data : [];

      setAllTodos((prev) => ({ ...prev, [monthKey]: todos }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTodosByMonth((prev) => ({ ...prev, [monthKey]: false }));
    }
  };

  const updateTodos = (
    updated: MonthlyTask[],
    year: number,
    month: number,
    monthKey: string,
  ) => {
    setAllTodos((prev) => ({ ...prev, [monthKey]: updated }));

    void fetch("/api/calendar-todos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year,
        month,
        tasks: updated,
      }),
    }).then((response) => {
      if (!response.ok) {
        void response
          .json()
          .then((errorPayload: { error?: string }) => {
            console.error(
              errorPayload.error ?? `Failed to save todos: ${response.status}`,
            );
          })
          .catch(() => {
            console.error(`Failed to save todos: ${response.status}`);
          });
      }
    });
  };

  return { allTodos, loadingTodosByMonth, loadTodos, updateTodos };
}
