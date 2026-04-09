import { MonthlyTask } from "@/lib/calendarData";

export function useTodos() {
  const loadTodos = async (
    year: number,
    month: number,
    monthKey: string,
    setAllTodos: React.Dispatch<
      React.SetStateAction<Record<string, MonthlyTask[]>>
    >,
  ) => {
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
    }
  };

  const updateTodos = (updated: MonthlyTask[], year: number, month: number) => {
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

  return { loadTodos, updateTodos };
}
