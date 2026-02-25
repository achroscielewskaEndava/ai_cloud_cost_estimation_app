"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { ChevronDownIcon, Monitor, XIcon } from "lucide-react";
import { categoryMeta, usageQuestions } from "@/app/estimation/configuration";

interface Props {
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

type Group = {
  category: string;
  label: string;
  Icon: React.ElementType;
  items: typeof usageQuestions;
};

export default function UsageModern({ answers, setAnswers }: Props) {
  const [open, setOpen] = useState(true);

  const groups = useMemo(() => {
    const byCat = new Map<string, Group>();

    for (const q of usageQuestions) {
      const meta = categoryMeta[q.category];
      const Icon = meta?.icon ?? Monitor;
      const label = meta?.label ?? "Unknown";

      if (!byCat.has(q.category)) {
        byCat.set(q.category, {
          category: q.category,
          label,
          Icon,
          items: [] as typeof usageQuestions,
        });
      }
      byCat.get(q.category)!.items.push(q);
    }

    return Array.from(byCat.values());
  }, []);

  const total = usageQuestions.length;
  const answered = usageQuestions.reduce(
    (acc, q) => acc + (answers[q.id] ? 1 : 0),
    0,
  );
  const progress = Math.round((answered / Math.max(1, total)) * 100);

  const clearQuestion = (id: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const resetAnswers = () => {
    setAnswers({});
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden border-border/60 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">2. Usage</CardTitle>
              <CardDescription>
                If it&apos;s not applicable, leave the question unanswered. The
                more you answer, the better the estimate!
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {answered}/{total} answered
              </Badge>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={resetAnswers}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear all usage answers"
              >
                <XIcon className="h-4 w-4" />
              </Button>

              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={open ? "Collapse" : "Expand"}
                >
                  <ChevronDownIcon
                    className={cn(
                      "h-4 w-4 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-8">
            {groups.map((g, gi) => {
              const answeredInGroup = g.items.reduce(
                (acc, q) => acc + (answers[q.id] ? 1 : 0),
                0,
              );

              return (
                <section key={g.category} className="space-y-4 mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                        <g.Icon className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{g.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {answeredInGroup}/{g.items.length} answered
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {g.items.map((q) => {
                      const selected = answers[q.id] ?? "";

                      return (
                        <div
                          key={q.id}
                          className="rounded-2xl border bg-card p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="text-sm font-medium leading-snug">
                                {q.label}
                              </div>
                            </div>

                            {selected ? (
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                onClick={() => clearQuestion(q.id)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                Clear
                              </Button>
                            ) : null}
                          </div>

                          <RadioGroup
                            value={selected}
                            onValueChange={(v) =>
                              setAnswers((prev) => ({ ...prev, [q.id]: v }))
                            }
                            className="mt-3"
                          >
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {q.options.map((opt) => (
                                <label
                                  key={opt}
                                  className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-3 py-3 transition-colors hover:bg-muted data-[selected=true]:border-primary data-[selected=true]:bg-primary/5 shadow-xs"
                                  data-selected={answers[q.id] === opt}
                                >
                                  <RadioGroupItem value={opt} />
                                  <div className="flex items-start gap-3">
                                    <span className="text-sm leading-snug">
                                      {opt}
                                    </span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </RadioGroup>
                        </div>
                      );
                    })}
                  </div>

                  {gi < groups.length - 1 ? (
                    <Separator className="my-2" />
                  ) : null}
                </section>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
