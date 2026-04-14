import { useEffect, useState, type DragEvent } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { MonthlyTask } from "@/lib/calendarData";
import { useTodos } from "@/app/calendar/hooks/useTodos";

interface TodoSidebarProps {
  year: number;
  month: number;
}

export function TodoSidebar({ year, month }: TodoSidebarProps) {
  const [newTask, setNewTask] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const monthKey = `${year}-${month}`;
  const { allTodos, loadingTodosByMonth, loadTodos, updateTodos } = useTodos();
  const tasks = allTodos[monthKey] ?? [];

  const monthLabel = `${month + 1} / ${year}`;

  useEffect(() => {
    if (allTodos[monthKey] || loadingTodosByMonth[monthKey]) return;

    loadTodos(year, month, monthKey);
  }, [allTodos, loadTodos, loadingTodosByMonth, month, monthKey, year]);

  const onUpdate = (updated: MonthlyTask[]) => {
    updateTodos(updated, year, month, monthKey);
  };

  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    onUpdate([...tasks, { id: `m${Date.now()}`, text, completed: false }]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    onUpdate(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const removeTask = (id: string) => {
    onUpdate(tasks.filter((t) => t.id !== id));
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...tasks];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    onUpdate(reordered);
    setDragIndex(index);
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="w-full bg-card rounded-2xl border p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          To Do
        </h2>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
          {monthLabel} · {completedCount}/{tasks.length}
        </p>
      </div>

      <div>
        <Input
          placeholder="Add a task…"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          className="h-9 text-sm rounded-xl border-border bg-muted/30 placeholder:text-muted-foreground/40"
        />
      </div>

      <ul className="flex flex-col gap-0.5 min-h-15">
        {tasks.map((task, i) => (
          <li
            key={task.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={() => setDragIndex(null)}
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all group cursor-grab active:cursor-grabbing ${
              dragIndex === i ? "opacity-40 scale-95" : "hover:bg-muted/40"
            }`}
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id)}
              className="shrink-0 rounded-full h-4 w-4"
            />
            <span
              className={`flex-1 truncate text-[13px] ${task.completed ? "line-through text-muted-foreground/50" : "text-foreground"}`}
            >
              {task.text}
            </span>
            <button
              onClick={() => removeTask(task.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-muted-foreground hover:text-destructive"
            >
              ✕
            </button>
          </li>
        ))}
        {tasks.length === 0 && (
          <li className="text-xs text-muted-foreground/50 text-center py-6">
            {loadingTodosByMonth[monthKey]
              ? "Loading tasks..."
              : "No tasks yet"}
          </li>
        )}
      </ul>
    </div>
  );
}
