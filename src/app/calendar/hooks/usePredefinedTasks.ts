import { PredefinedTask } from "@/lib/calendarData";
import { useState } from "react";

export function usePredefinedTasks() {
  const [allPredefinedTasks, setAllPredefinedTasks] = useState<
    Record<string, PredefinedTask[]>
  >({});
  const [loadingTasksByMonth, setLoadingTasksByMonth] = useState<
    Record<string, boolean>
  >({});
  const [taskErrorsByMonth, setTaskErrorsByMonth] = useState<
    Record<string, string | null>
  >({});

  const loadPredefinedTasks = async (
    targetYear: number,
    targetMonth: number,
    targetMonthKey: string,
  ) => {
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
  };

  return {
    loadPredefinedTasks,
    allPredefinedTasks,
    loadingTasksByMonth,
    taskErrorsByMonth,
  };
}
