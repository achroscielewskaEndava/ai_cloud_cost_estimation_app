import { Button } from "@/components/ui/button";

interface MonthNavigatorProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function MonthNavigator({
  year,
  month,
  onPrev,
  onNext,
  onToday,
}: MonthNavigatorProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrev}
        className="text-muted-foreground text-xs px-2"
      >
        ←
      </Button>
      <button
        onClick={onToday}
        className="text-center min-w-[160px] hover:opacity-70 transition-opacity"
      >
        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          {month + 1} / {year}
        </h1>
      </button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        className="text-muted-foreground text-xs px-2"
      >
        →
      </Button>
    </div>
  );
}
