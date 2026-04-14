import {
  CompletionMap,
  PredefinedTask,
  syncCompletionsWithTasks,
} from "@/lib/calendarData";
import { useState } from "react";

export function useCompletions() {
  const [allCompletions, setAllCompletions] = useState<
    Record<string, CompletionMap>
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

  const saveCompletions = async (
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
  };

  const loadCompletions = async (
    allPredefinedTasks: Record<string, PredefinedTask[]>,
    targetYear: number,
    targetMonth: number,
    targetMonthKey: string,
  ) => {
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
  };

  return {
    saveCompletions,
    savingCompletionsByMonth,
    dirtyCompletionsByMonth,
    setDirtyCompletionsByMonth,
    completionErrorsByMonth,
    loadCompletions,
    allCompletions,
    setAllCompletions,
    loadingCompletionsByMonth,
  };
}
