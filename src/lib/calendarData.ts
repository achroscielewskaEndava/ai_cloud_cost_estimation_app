export interface PredefinedTask {
  id: string;
  label: string;
}

export interface MonthlyTask {
  id: string;
  text: string;
  completed: boolean;
}

export type CompletionMap = Record<string, Record<string, boolean>>;
// key: "YYYY-MM-DD", value: { taskId: true/false }

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthName(month: number): string {
  return new Date(2024, month).toLocaleString("default", { month: "long" });
}

export function makeDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function generateMockCompletions(
  year: number,
  month: number,
  tasks: PredefinedTask[],
): CompletionMap {
  const days = getDaysInMonth(year, month);
  const map: CompletionMap = {};
  for (let d = 1; d <= days; d++) {
    const key = makeDateKey(year, month, d);
    const dayData: Record<string, boolean> = {};
    tasks.forEach((t) => {
      dayData[t.id] = Math.random() > 0.55;
    });
    map[key] = dayData;
  }
  return map;
}

export function syncCompletionsWithTasks(
  year: number,
  month: number,
  tasks: PredefinedTask[],
  existing: CompletionMap = {},
): CompletionMap {
  const days = getDaysInMonth(year, month);
  const map: CompletionMap = {};

  for (let day = 1; day <= days; day++) {
    const key = makeDateKey(year, month, day);
    const existingDay = existing[key] ?? {};
    const dayData: Record<string, boolean> = {};

    tasks.forEach((task) => {
      dayData[task.id] = existingDay[task.id] ?? false;
    });

    map[key] = dayData;
  }

  return map;
}
