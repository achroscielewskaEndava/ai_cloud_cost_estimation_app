import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  Eye,
  EyeOff,
  Lightbulb,
} from "lucide-react";

import { EstimateResponse } from "@/app/api/estimation/route";

const confidenceVariant = (c: string) => {
  if (c === "high") return "default" as const;
  if (c === "medium") return "warning" as const;
  return "destructive" as const;
};
interface Props {
  est: EstimateResponse["estimates"][number];
  isOpen: boolean;
  onToggle: () => void;
}

const ProvidersEstimatesCard = ({ est, isOpen, onToggle }: Props) => {
  const [showAssumptions, setShowAssumptions] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="rounded-lg border bg-card p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">{est.provider}</span>
          <div>
            <span className="text-xs text-muted-foreground mr-2">
              Confidence level:
            </span>
            <Badge variant={confidenceVariant(est.confidence)}>
              {est.confidence}
            </Badge>
          </div>
        </div>

        {/* Totals */}
        <div className="flex gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Monthly</p>
            <p className="text-xl font-mono font-semibold">
              ${est.monthlyTotal}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Daily</p>
            <p className="text-xl font-mono text-muted-foreground">
              ${est.dailyTotal}
            </p>
          </div>
        </div>

        {/* Assumptions toggle */}
        <button
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Info className="h-4 w-4" />
          <span>{est.assumptions.length} assumptions</span>
          {showAssumptions ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        {showAssumptions && (
          <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
            {est.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}

        {/* Details trigger */}
        <CollapsibleTrigger asChild>
          <button className="inline-flex items-center gap-1 text-sm text-primary hover:underline px-4">
            {isOpen ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {isOpen ? "Hide details" : "Show details"}
          </button>
        </CollapsibleTrigger>

        {/* Breakdown */}
        <CollapsibleContent>
          <div className="space-y-3 pt-2 border-t">
            {est.breakdown.map((b, i) => (
              <div key={i} className="flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.item}</p>
                  <p className="text-xs text-muted-foreground">{b.notes}</p>
                </div>
                <span className="text-sm font-mono whitespace-nowrap">
                  ${b.monthly}
                </span>
              </div>
            ))}
            {est.recommendation && (
              <div className="flex flex-row items-center gap-2">
                <Lightbulb className="h-6 w-6 text-warning" />
                <p className="text-sm text-muted-foreground italic pt-2">
                  {est.recommendation}
                </p>
              </div>
            )}
            {est.pricingLinks.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                {est.pricingLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {link}
                  </a>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

/* ── Main Results component ── */
const Results = ({ results }: { results: EstimateResponse }) => {
  const [openProviders, setOpenProviders] = useState<Record<string, boolean>>(
    {},
  );

  if (!results) return null;

  const toggle = (provider: string) =>
    setOpenProviders((prev) => ({ ...prev, [provider]: !prev[provider] }));

  return (
    <Card className="shadow-card overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span>Cost Estimates</span>
          <span className="text-sm font-normal text-muted-foreground">
            As of {results.asOf}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.estimates.map((est) => (
          <ProvidersEstimatesCard
            key={est.provider}
            est={est}
            isOpen={openProviders[est.provider] ?? false}
            onToggle={() => toggle(est.provider)}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default Results;
