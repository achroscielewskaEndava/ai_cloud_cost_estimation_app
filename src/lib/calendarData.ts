export const PREDEFINED_TASKS = [
  { id: "exercise", label: "Exercise" },
  { id: "reading", label: "Reading" },
  { id: "water", label: "Water 2L" },
  { id: "meditation", label: "Meditate" },
  { id: "journal", label: "Journal" },
  { id: "sleep8h", label: "Sleep 8h" },
];

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

export function generateMockMonthlyTasks(): MonthlyTask[] {
  return [
    { id: "m1", text: "Finish project proposal", completed: true },
    { id: "m2", text: "Schedule dentist appointment", completed: false },
    { id: "m3", text: "Read 2 books", completed: false },
    { id: "m4", text: "Clean out garage", completed: false },
    { id: "m5", text: "Plan weekend trip", completed: true },
  ];
}
