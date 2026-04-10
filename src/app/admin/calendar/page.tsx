"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MonthNavigator } from "@/components/calendar/month-navigator";
import { Copy, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { PredefinedTask } from "@/lib/calendarData";
import { useCalendarPredefinedTasks } from "@/app/admin/calendar/hooks/useCalendarPredefinedTasks";

const now = new Date();

export default function AdminCalendarPage() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskId, setNewTaskId] = useState("");

  const {
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
  } = useCalendarPredefinedTasks({ year, month });

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const navigate = (dir: -1 | 1) => {
    setMonth((prev) => {
      const next = prev + dir;
      if (next < 0) {
        setYear((y) => y - 1);
        return 11;
      }
      if (next > 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return next;
    });
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const handleAddTask = async () => {
    const added = await addTask(newTaskLabel, newTaskId);
    if (!added) return;

    setNewTaskLabel("");
    setNewTaskId("");
  };

  const updateTask = (
    index: number,
    field: keyof PredefinedTask,
    value: string,
  ) => {
    setTasks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setIsDirty(true);
    clearFeedback();
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
    clearFeedback();
  };

  const headerText = useMemo(() => {
    return `Managing ${month + 1}/${year}`;
  }, [month, year]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">{headerText}</p>
        </div>
        <MonthNavigator
          year={year}
          month={month}
          onPrev={() => navigate(-1)}
          onNext={() => navigate(1)}
          onToday={goToday}
        />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Predefined Tasks Per Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add tasks with POST and persist all edits for this month with Save
            (PUT).
          </p>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyFromPreviousMonth()}
              disabled={isLoading || isCopying || isSaving}
            >
              {isCopying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copy From Previous Month
            </Button>
          </div>

          <div className="rounded-xl border p-3 sm:p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
              <Input
                placeholder="Task label (e.g. Work from Office)"
                value={newTaskLabel}
                onChange={(e) => setNewTaskLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleAddTask()}
              />
              <Input
                placeholder="Optional id (e.g. workFromOffice)"
                value={newTaskId}
                onChange={(e) => setNewTaskId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleAddTask()}
              />
              <Button
                onClick={() => void handleAddTask()}
                disabled={isAdding || !newTaskLabel.trim()}
                className="w-full md:w-auto"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add
              </Button>
            </div>
          </div>

          <div className="rounded-xl border divide-y">
            {isLoading ? (
              <div className="py-8 flex items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading tasks...
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No predefined tasks for this month yet.
              </div>
            ) : (
              tasks.map((task, index) => (
                <div
                  key={`${task.id}-${index}`}
                  className="grid gap-2 p-3 md:grid-cols-[220px_1fr_auto]"
                >
                  <Input
                    value={task.id}
                    onChange={(e) => updateTask(index, "id", e.target.value)}
                    placeholder="id"
                  />
                  <Input
                    value={task.label}
                    onChange={(e) => updateTask(index, "label", e.target.value)}
                    placeholder="label"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTask(index)}
                    aria-label="Remove task"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <div className="flex justify-end">
            <Button
              onClick={() => void saveTasks()}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Month Tasks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
