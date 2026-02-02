"use client";
import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { ChevronDown, RefreshCw } from "lucide-react";

export type ChartKind = "bar" | "line" | "pie" | "area";

export type TimePreset = "day" | "week" | "month" | "year" | "all";

export type FilterOption = { label: string; value: string };
export type FilterConfig<T> = {
  id: string;
  label: string;
  field?: keyof T | ((item: T) => string | number | boolean | null | undefined);
  type?: "single" | "multi";
  options: FilterOption[];
  values?: string[];
  onChange?: (values: string[]) => void;
};

export type SeriesConfig<T> = {
  key: keyof T | ((row: T) => number);
  label?: string;
  color?: string;
  type?: ChartKind; // allows per-series types on mixed charts
  stackId?: string;
  yAxisId?: string | number;
};

export interface AdvancedChartProps<T extends Record<string, any>> {
  data: T[];
  xKey?: keyof T | ((row: T) => string | number | Date);
  kind: ChartKind;
  series: SeriesConfig<T>[];
  title?: string;
  description?: string;
  height?: number;
  className?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  timePreset?: TimePreset;
  onTimePresetChange?: (preset: TimePreset) => void;
  timeRange?: { from: Date | string; to: Date | string } | null;
  onTimeRangeReset?: () => void;
  comparePrevious?: boolean;
  filters?: FilterConfig<T>[];
  loading?: boolean;
}

function isDate(d: unknown): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

function inRange(
  date: Date,
  range?: { from: Date | string; to: Date | string } | null
): boolean {
  if (!range) return true;
  const from = toDate(range.from);
  const to = toDate(range.to);
  return date >= from && date <= to;
}

function bucketTime(d: Date, preset: TimePreset): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  switch (preset) {
    case "day":
      return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`;
    case "week": {
      const dt = new Date(d);
      const dayNum = (dt.getDay() + 6) % 7; // ISO week: Monday=0
      dt.setDate(dt.getDate() - dayNum);
      const wy = dt.getFullYear();
      const wm = dt.getMonth() + 1;
      const wd = dt.getDate();
      return `W:${wy}-${String(wm).padStart(2, "0")}-${String(wd).padStart(
        2,
        "0"
      )}`;
    }
    case "month":
      return `${y}-${String(m).padStart(2, "0")}`;
    case "year":
      return `${y}`;
    case "all":
    default:
      return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`;
  }
}

function getValue<T>(row: T, key: keyof T | ((r: T) => any)) {
  return typeof key === "function" ? key(row) : (row as any)[key];
}

function defaultKeyExtractor<T>(row: T, _i: number) {
  return JSON.stringify(row);
}

export function AdvancedChart<T extends Record<string, any>>({
  data,
  xKey,
  kind,
  series,
  title,
  description,
  height = 320,
  className,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  stacked = false,
  timePreset: presetProp,
  onTimePresetChange,
  timeRange,
  onTimeRangeReset,
  comparePrevious = false,
  filters = [],
  loading = false,
}: AdvancedChartProps<T>) {
  const [internalPreset, setInternalPreset] = useState<TimePreset>(
    presetProp || "all"
  );
  const timePreset = presetProp ?? internalPreset;

  const handlePresetChange = (v: TimePreset) => {
    if (onTimePresetChange) onTimePresetChange(v);
    else setInternalPreset(v);
  };

  // Apply filters
  const filtered = useMemo(() => {
    if (!filters.length) return data;
    return data.filter((row) => {
      return filters.every((f) => {
        const values = f.values ?? [];
        if (!values.length) return true;
        const raw = f.field ? getValue(row, f.field) : null;
        const str = raw === null || raw === undefined ? "" : String(raw);
        return f.type === "multi" ? values.includes(str) : values[0] === str;
      });
    });
  }, [data, filters]);

  // Time range + bucketing
  const timeKey = xKey;
  const transformed = useMemo(() => {
    if (!timeKey) return filtered;

    const withTime = filtered
      .map((r) => {
        const x = getValue(r, timeKey);
        const d = x instanceof Date ? x : new Date(x);
        return { r, d };
      })
      .filter((x) => isDate(x.d) && inRange(x.d, timeRange));

    if (timePreset === "all") {
      return withTime.map(({ r }) => r);
    }

    // bucket by preset
    const buckets = new Map<string, T[]>();
    withTime.forEach(({ r, d }) => {
      const b = bucketTime(d, timePreset);
      const arr = buckets.get(b) || [];
      arr.push(r);
      buckets.set(b, arr);
    });

    // aggregate numeric series by sum
    const rows: any[] = [];
    buckets.forEach((items, key) => {
      const base: any = { name: key };
      series.forEach((s) => {
        const sum = items.reduce((acc, it) => {
          const v = getValue(it, s.key);
          const n = typeof v === "number" ? v : Number(v ?? 0);
          return acc + (isNaN(n) ? 0 : n);
        }, 0);
        base[s.label || String(typeof s.key === "function" ? "value" : s.key)] =
          sum;
      });
      rows.push(base);
    });

    // sort by name (time asc)
    rows.sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
    return rows as T[];
  }, [filtered, series, timeKey, timeRange, timePreset]);

  // previous period overlay
  const comparisonData = useMemo(() => {
    if (!comparePrevious || !timeRange || !timeKey) return null;
    const from = toDate(timeRange.from);
    const to = toDate(timeRange.to);
    const diff = to.getTime() - from.getTime();
    const prevRange = {
      from: new Date(from.getTime() - diff),
      to: new Date(to.getTime() - diff),
    };

    const prev = data
      .map((r) => {
        const x = getValue(r, timeKey);
        const d = x instanceof Date ? x : new Date(x);
        return { r, d };
      })
      .filter((x) => isDate(x.d) && inRange(x.d, prevRange));

    if (timePreset === "all") {
      return prev.map(({ r }) => r);
    }

    const buckets = new Map<string, T[]>();
    prev.forEach(({ r, d }) => {
      const b = bucketTime(d, timePreset);
      const arr = buckets.get(b) || [];
      arr.push(r);
      buckets.set(b, arr);
    });

    const rows: any[] = [];
    buckets.forEach((items, key) => {
      const base: any = { name: key };
      series.forEach((s) => {
        const sum = items.reduce((acc, it) => {
          const v = getValue(it, s.key);
          const n = typeof v === "number" ? v : Number(v ?? 0);
          return acc + (isNaN(n) ? 0 : n);
        }, 0);
        base[
          (s.label || String(typeof s.key === "function" ? "value" : s.key)) +
            " (prev)"
        ] = sum;
      });
      rows.push(base);
    });

    rows.sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
    return rows as T[];
  }, [comparePrevious, data, series, timeKey, timeRange, timePreset]);

  const chartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color?: string }> = {};
    series.forEach((s, i) => {
      const label =
        s.label ||
        String(typeof s.key === "function" ? `Series ${i + 1}` : s.key);
      cfg[label] = { label, color: s.color };
      if (comparisonData)
        cfg[`${label} (prev)`] = { label: `${label} (prev)`, color: s.color };
    });
    return cfg;
  }, [series, comparisonData]);

  const hasData = transformed && transformed.length > 0;

  const Controls = (
    <div className="flex items-center gap-2">
      {filters?.map((f) => {
        const selected = f.values ?? [];
        const multi = f.type !== "single";
        const summary = selected.length
          ? `${selected.length}/${f.options.length}`
          : "Tous";
        return (
          <DropdownMenu key={f.id}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <span>{f.label}</span>
                <Badge variant="secondary" className="ml-1">
                  {summary}
                </Badge>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {f.options.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={selected.includes(opt.value)}
                  onCheckedChange={(c) => {
                    const next = (() => {
                      if (multi) {
                        return c
                          ? [...selected, opt.value]
                          : selected.filter((v) => v !== opt.value);
                      } else {
                        return c ? [opt.value] : [];
                      }
                    })();
                    f.onChange?.(Array.from(new Set(next)));
                  }}
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}

      <Select
        value={timePreset}
        onValueChange={(v) => handlePresetChange(v as TimePreset)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Période" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tout</SelectItem>
          <SelectItem value="day">Jour</SelectItem>
          <SelectItem value="week">Semaine</SelectItem>
          <SelectItem value="month">Mois</SelectItem>
          <SelectItem value="year">Année</SelectItem>
        </SelectContent>
      </Select>

      {timeRange && (
        <Button
          variant="ghost"
          size="icon"
          title="Réinitialiser la période"
          onClick={onTimeRangeReset}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const body = (() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
          Chargement…
        </div>
      );
    }

    if (!hasData) {
      return (
        <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
          Aucune donnée
        </div>
      );
    }

    const merged = comparisonData
      ? mergeComparison(transformed as any[], comparisonData as any[])
      : (transformed as any[]);

    if (kind === "pie") {
      const totalKey = series[0]?.label || String(series[0]?.key || "value");
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            {showTooltip && <Tooltip content={<ChartTooltipContent />} />}
            {showLegend && <Legend content={<ChartLegendContent />} />}
            <Pie
              data={merged}
              dataKey={totalKey}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
            >
              {merged.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={series[index % series.length]?.color}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // cartesian charts
    const renderSeries = (s: SeriesConfig<T>) => {
      const key =
        s.label || String(typeof s.key === "function" ? "value" : s.key);
      const color = s.color;
      const common = { key, dataKey: key, name: key } as const;
      if (s.type === "line" || kind === "line") {
        return (
          <Line
            {...(common as any)}
            type="monotone"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 2 }}
            yAxisId={s.yAxisId}
          />
        );
      }
      if (s.type === "area" || kind === "area") {
        return (
          <Area
            {...(common as any)}
            type="monotone"
            stroke={color}
            fill={color}
            stackId={stacked ? s.stackId || "stack" : undefined}
            yAxisId={s.yAxisId}
          />
        );
      }
      return (
        <Bar
          {...(common as any)}
          fill={color}
          stackId={stacked ? s.stackId || "stack" : undefined}
          yAxisId={s.yAxisId}
        />
      );
    };

    return (
      <ChartContainer config={chartConfig} className="w-full">
        <ResponsiveContainer width="100%" height={height}>
          <div className="w-full h-full">
            {kind === "bar" && (
              <BarChart data={merged}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                <XAxis dataKey="name" />
                <YAxis />
                {showTooltip && (
                  <ChartTooltip content={<ChartTooltipContent />} />
                )}
                {showLegend && <ChartLegend content={<ChartLegendContent />} />}
                {series.map((s) => renderSeries(s))}
              </BarChart>
            )}
            {kind === "line" && (
              <LineChart data={merged}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                <XAxis dataKey="name" />
                <YAxis />
                {showTooltip && (
                  <ChartTooltip content={<ChartTooltipContent />} />
                )}
                {showLegend && <ChartLegend content={<ChartLegendContent />} />}
                {series.map((s) => renderSeries(s))}
              </LineChart>
            )}
            {kind === "area" && (
              <AreaChart data={merged}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                <XAxis dataKey="name" />
                <YAxis />
                {showTooltip && (
                  <ChartTooltip content={<ChartTooltipContent />} />
                )}
                {showLegend && <ChartLegend content={<ChartLegendContent />} />}
                {series.map((s) => renderSeries(s))}
              </AreaChart>
            )}
          </div>
        </ResponsiveContainer>
      </ChartContainer>
    );
  })();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          {title && <CardTitle>{title}</CardTitle>}
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
        </div>
        <div className="flex items-center gap-2">{Controls}</div>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

function mergeComparison(current: any[], prev: any[]) {
  const map = new Map<string, any>();
  [...current, ...prev].forEach((row) => {
    const key = String(row.name ?? "");
    const base = map.get(key) || { name: key };
    Object.assign(base, row);
    map.set(key, base);
  });
  return Array.from(map.values());
}
