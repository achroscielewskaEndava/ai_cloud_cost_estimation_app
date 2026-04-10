export const PREDEFINED_TASKS = [
  { id: "workFromOffice", label: "Work from Office" },
  { id: "workation", label: "Workation" },
  { id: "holidays2025", label: "Holidays 2025" },
  { id: "holidays2026", label: "Holidays 2026" },
  { id: "learningReact", label: "Learning React" },
];

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
): CompletionMap {
  const days = getDaysInMonth(year, month);
  const map: CompletionMap = {};
  for (let d = 1; d <= days; d++) {
    const key = makeDateKey(year, month, d);
    const dayData: Record<string, boolean> = {};
    PREDEFINED_TASKS.forEach((t) => {
      dayData[t.id] = Math.random() > 0.55;
    });
    map[key] = dayData;
  }
  return map;
}
