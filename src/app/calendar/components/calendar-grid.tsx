import { Check } from "lucide-react";
import {
  getDaysInMonth,
  makeDateKey,
  type CompletionMap,
  type PredefinedTask,
} from "@/lib/calendarData";

interface CalendarGridProps {
  year: number;
  month: number;
  tasks: PredefinedTask[];
  completions: CompletionMap;
  onToggle: (dateKey: string, taskId: string) => void;
}

export function CalendarGrid({
  year,
  month,
  tasks,
  completions,
  onToggle,
}: CalendarGridProps) {
  const days = getDaysInMonth(year, month);
  const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

  const totals: Record<string, number> = {};
  tasks.forEach((t) => {
    totals[t.id] = 0;
    dayNumbers.forEach((d) => {
      const key = makeDateKey(year, month, d);
      if (completions[key]?.[t.id]) totals[t.id]++;
    });
  });

  const getDayOfWeek = (day: number) =>
    new Date(year, month, day).toLocaleDateString("en", { weekday: "short" });

  const today = new Date();
  const isToday = (day: number) =>
    year === today.getFullYear() &&
    month === today.getMonth() &&
    day === today.getDate();

  return (
    <div className="overflow-auto rounded-2xl border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-[11px] uppercase tracking-widest text-muted-foreground font-medium border-b min-w-22.5">
              Day
            </th>
            {tasks.map((task) => (
              <th
                key={task.id}
                className="px-2 py-3 text-center text-[11px] uppercase tracking-widest text-muted-foreground font-medium border-b min-w-19"
              >
                {task.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dayNumbers.map((day) => {
            const dateKey = makeDateKey(year, month, day);
            const dow = getDayOfWeek(day);
            const isWe = dow === "Sat" || dow === "Sun";
            const isTd = isToday(day);

            return (
              <tr
                key={day}
                className={`transition-colors ${isWe ? "bg-muted/30" : ""} ${isTd ? "bg-accent/15 ring-1 ring-inset ring-accent/40" : ""}`}
              >
                <td
                  className={`sticky left-0 z-10 px-4 py-0 border-b ${isTd ? "bg-accent/20" : "bg-card"}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex min-w-7 items-center justify-center rounded-md px-2 py-1 text-[13px] font-semibold tabular-nums ${isTd ? "bg-accent text-white shadow-sm" : "text-foreground"}`}
                    >
                      {day}
                    </span>
                    <span
                      className={`text-[11px] ${isTd ? "font-medium text-accent" : "text-muted-foreground/60"}`}
                    >
                      {dow}
                    </span>
                  </div>
                </td>
                {tasks.map((task) => {
                  const checked = !!completions[dateKey]?.[task.id];
                  return (
                    <td key={task.id} className="border-b p-0">
                      <button
                        onClick={() => onToggle(dateKey, task.id)}
                        className={`w-full h-9 flex items-center justify-center transition-all duration-150 ${
                          checked
                            ? "text-primary"
                            : "text-transparent hover:text-muted-foreground/20"
                        }`}
                        aria-label={`${task.label} on day ${day}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 ${
                            checked
                              ? "bg-primary text-primary-foreground scale-100"
                              : "border border-border hover:border-muted-foreground/30 scale-95 hover:scale-100"
                          }`}
                        >
                          {checked && (
                            <Check className="h-3 w-3" strokeWidth={3} />
                          )}
                        </div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
          <tr>
            <td className="sticky left-0 z-10 bg-card px-4 py-2.5 text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              Total
            </td>
            {tasks.map((task) => {
              const pct = Math.round((totals[task.id] / days) * 100);
              return (
                <td key={task.id} className="text-center py-2.5">
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    {totals[task.id]}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-0.5">
                    /{days}
                  </span>
                  <div className="mx-auto mt-1 w-10 h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
