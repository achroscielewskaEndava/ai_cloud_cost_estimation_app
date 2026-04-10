import { useCallback, useState } from "react";

import type { PredefinedTask } from "@/lib/calendarData";

interface UseCalendarPredefinedTasksOptions {
  year: number;
  month: number;
}

export function useCalendarPredefinedTasks({
  year,
  month,
}: UseCalendarPredefinedTasksOptions) {
  const [tasks, setTasks] = useState<PredefinedTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearFeedback = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const loadTasks = useCallback(async () => {
    clearFeedback();
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/calendar-predefined-tasks?year=${year}&month=${month}`,
      );

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorPayload?.error ?? `Failed to load tasks (${response.status})`,
        );
      }

      const payload = (await response.json()) as { data?: PredefinedTask[] };
      const loadedTasks = Array.isArray(payload.data) ? payload.data : [];

      setTasks(loadedTasks);
      setIsDirty(false);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load predefined tasks";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [clearFeedback, month, year]);

  const addTask = useCallback(
    async (labelRaw: string, idRaw?: string) => {
      const label = labelRaw.trim();
      const preferredId = idRaw?.trim();

      if (!label) {
        return false;
      }

      clearFeedback();
      setIsAdding(true);

      try {
        const response = await fetch("/api/admin/calendar-predefined-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            month,
            label,
            id: preferredId || undefined,
          }),
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            errorPayload?.error ?? `Failed to add task (${response.status})`,
          );
        }

        const payload = (await response.json()) as { data?: PredefinedTask };

        if (payload.data) {
          setTasks((prev) => [...prev, payload.data as PredefinedTask]);
        }

        setSuccess("Task added.");
        return true;
      } catch (addError) {
        const message =
          addError instanceof Error ? addError.message : "Failed to add task";
        setError(message);
        return false;
      } finally {
        setIsAdding(false);
      }
    },
    [clearFeedback, month, year],
  );

  const saveTasks = useCallback(async () => {
    clearFeedback();
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/calendar-predefined-tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          month,
          tasks,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorPayload?.error ?? `Failed to save tasks (${response.status})`,
        );
      }

      const payload = (await response.json()) as { data?: PredefinedTask[] };
      const savedTasks = Array.isArray(payload.data) ? payload.data : tasks;

      setTasks(savedTasks);
      setIsDirty(false);
      setSuccess("Tasks saved successfully.");
      return true;
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save tasks";
      setError(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [clearFeedback, month, tasks, year]);

  const copyFromPreviousMonth = useCallback(async () => {
    clearFeedback();
    setIsCopying(true);

    try {
      const previousMonth = month === 0 ? 11 : month - 1;
      const previousYear = month === 0 ? year - 1 : year;

      const response = await fetch(
        `/api/admin/calendar-predefined-tasks?year=${previousYear}&month=${previousMonth}`,
      );

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorPayload?.error ??
            `Failed to load previous month tasks (${response.status})`,
        );
      }

      const payload = (await response.json()) as { data?: PredefinedTask[] };
      const previousTasks = Array.isArray(payload.data) ? payload.data : [];

      setTasks(previousTasks);
      setIsDirty(true);

      if (previousTasks.length === 0) {
        setSuccess("Previous month has no tasks. Current list was cleared.");
      } else {
        setSuccess(
          `Copied ${previousTasks.length} task(s) from previous month.`,
        );
      }
    } catch (copyError) {
      const message =
        copyError instanceof Error
          ? copyError.message
          : "Failed to copy tasks from previous month";
      setError(message);
    } finally {
      setIsCopying(false);
    }
  }, [clearFeedback, month, year]);

  return {
    tasks,
    setTasks,
    isLoading,
    isSaving,
    isAdding,
    isCopying,
    isDirty,
    setIsDirty,
    error,
    success,
    clearFeedback,
    loadTasks,
    addTask,
    saveTasks,
    copyFromPreviousMonth,
  };
}
