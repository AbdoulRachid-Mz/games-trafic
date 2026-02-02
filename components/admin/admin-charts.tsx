"use client";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";

// --- Users Growth Chart ---

const usersGrowthConfig: ChartConfig = {
  users: {
    label: "Utilisateurs",
    color: "hsl(var(--primary))",
  },
};

export function UsersGrowthChart({
  data,
  height = 300,
}: {
  data: any[];
  height?: number;
}) {
  return (
    <ChartContainer config={usersGrowthConfig} className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="Utilisateurs"
            stroke="var(--color-users)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// --- Revenue Chart ---

const revenueConfig: ChartConfig = {
  revenue: {
    label: "Revenus (GTC)",
    color: "hsl(var(--chart-1))",
  },
};

export function RevenueChart({
  data,
  height = 300,
}: {
  data: any[];
  height?: number;
}) {
  return (
    <ChartContainer config={revenueConfig} className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar
            dataKey="Revenus (GTC)"
            fill="var(--color-revenue)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// --- New Users Area Chart ---

const newUsersConfig: ChartConfig = {
  newUsers: {
    label: "Nouveaux utilisateurs",
    color: "hsl(var(--chart-2))",
  },
};

export function NewUsersChart({
  data,
  height = 300,
}: {
  data: any[];
  height?: number;
}) {
  return (
    <ChartContainer config={newUsersConfig} className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="Nouveaux utilisateurs"
            stroke="var(--color-newUsers)"
            fill="var(--color-newUsers)"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// --- Sales By Category Pie Chart ---

const salesCategoryConfig: ChartConfig = {
  value: {
    label: "Ventes",
  },
  Gaming: {
    label: "Gaming",
    color: "hsl(var(--chart-1))",
  },
  eSports: {
    label: "eSports",
    color: "hsl(var(--chart-2))",
  },
  Digital: {
    label: "Digital",
    color: "hsl(var(--chart-3))",
  },
  Collection: {
    label: "Collection",
    color: "hsl(var(--chart-4))",
  },
};

export function SalesCategoryChart({
  data,
  height = 300,
}: {
  data: any[];
  height?: number;
}) {
  return (
    <ChartContainer config={salesCategoryConfig} className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  salesCategoryConfig[
                    entry.name as keyof typeof salesCategoryConfig
                  ]?.color || "gray"
                }
              />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent />}
            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// --- Top Shops Bar Chart ---

const topShopsConfig: ChartConfig = {
  sales: {
    label: "Ventes",
    color: "hsl(var(--primary))",
  },
};

export function TopShopsChart({
  data,
  height = 300,
}: {
  data: any[];
  height?: number;
}) {
  return (
    <ChartContainer config={topShopsConfig} className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar
            dataKey="Ventes"
            fill="var(--color-sales)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// --- Finance Evolution Chart ---

const financeConfig: ChartConfig = {
  revenue: {
    label: "Revenus (GTC)",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Dépenses (GTC)",
    color: "hsl(var(--chart-2))",
  },
};

export function FinanceEvolutionChart({
  data,
  height = 300,
}: {
  data: any[];
  height?: number;
}) {
  return (
    <ChartContainer config={financeConfig} className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="Revenus (GTC)"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Dépenses (GTC)"
            stroke="var(--color-expenses)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// --- Tournament Stats Chart ---

const tournamentConfig: ChartConfig = {
  tournaments: {
    label: "Tournois",
    color: "hsl(var(--chart-3))",
  },
};

export function TournamentStatsChart({
  data,
  height = 300,
}: {
  data: any[];
  height?: number;
}) {
  return (
    <ChartContainer config={tournamentConfig} className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar
            dataKey="Tournois"
            fill="var(--color-tournaments)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
