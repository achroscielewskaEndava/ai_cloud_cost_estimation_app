import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  ResponsiveContainer,
} from "recharts";
import { DEFAULT_COLOR, PROVIDER_HEX } from "@/app/admin/components/Legend";

interface SingleData {
  provider: string;
  count: number;
}

interface CompareData {
  provider: string;
  countPeriodA: number;
  countPeriodB: number;
}

type SingleDataPoint = SingleData & {
  fill: string;
};

type CompareDataPoint = CompareData & {
  fill: string;
};

interface ProviderChartsProps {
  mode: "single" | "compare";
  singleData?: SingleData[];
  compareData?: CompareData[];
  periodALabel?: string;
  periodBLabel?: string;
}

const ProviderCharts = ({
  mode,
  singleData = [],
  compareData = [],
  periodALabel,
  periodBLabel,
}: ProviderChartsProps) => {
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  const singleDataWithColors: SingleDataPoint[] = singleData.map((entry) => ({
    ...entry,
    fill:
      PROVIDER_HEX[entry.provider as keyof typeof PROVIDER_HEX] ??
      DEFAULT_COLOR,
  }));

  const compareDataWithColors: CompareDataPoint[] = compareData.map(
    (entry) => ({
      ...entry,
      fill:
        PROVIDER_HEX[entry.provider as keyof typeof PROVIDER_HEX] ??
        DEFAULT_COLOR,
    }),
  );

  const renderSingleBar = () => (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={singleDataWithColors}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--muted-foreground)" />
        <XAxis
          dataKey="provider"
          stroke="var(--muted-foreground)"
          fontSize={13}
        />
        <YAxis stroke="var(--muted-foreground)" fontSize={13} />
        <Tooltip
          cursor={false}
          contentStyle={{
            border: "unset",
            borderRadius: 8,
          }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderCompareBar = () => (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={compareDataWithColors}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--muted-foreground)" />
        <XAxis
          dataKey="provider"
          stroke="var(--muted-foreground)"
          fontSize={13}
        />
        <YAxis stroke="var(--muted-foreground)" fontSize={13} />
        <Tooltip
          cursor={false}
          contentStyle={{
            border: "unset",
            borderRadius: 8,
          }}
        />
        <Bar
          dataKey="countPeriodA"
          name={periodALabel}
          fill={
            PROVIDER_HEX[periodALabel as keyof typeof PROVIDER_HEX] ??
            DEFAULT_COLOR
          }
          fillOpacity={0.6}
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="countPeriodB"
          name={periodBLabel ?? ""}
          fill={
            PROVIDER_HEX[periodBLabel as keyof typeof PROVIDER_HEX] ??
            DEFAULT_COLOR
          }
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderSinglePie = () => (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={singleDataWithColors}
          dataKey="count"
          nameKey="provider"
          cx="50%"
          cy="50%"
          outerRadius={130}
          innerRadius={60}
          paddingAngle={3}
          label={({ name, percent }) =>
            `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
        />
        <Tooltip
          contentStyle={{
            border: "unset",
            borderRadius: 8,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">
          {mode === "single" ? "Provider Distribution" : "Period Comparison"}
        </CardTitle>
        {mode === "single" && (
          <Tabs
            value={chartType}
            onValueChange={(v) => setChartType(v as "bar" | "pie")}
          >
            <TabsList className="h-8">
              <TabsTrigger value="bar" className="text-xs px-3">
                Bar
              </TabsTrigger>
              <TabsTrigger value="pie" className="text-xs px-3">
                Pie
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      <CardContent>
        {mode === "single"
          ? chartType === "bar"
            ? renderSingleBar()
            : renderSinglePie()
          : renderCompareBar()}
      </CardContent>
    </Card>
  );
};

export default ProviderCharts;
