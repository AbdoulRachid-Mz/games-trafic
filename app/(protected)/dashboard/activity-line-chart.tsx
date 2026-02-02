"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type ActivityLineChartProps = {
  data: any[];
};

export function ActivityLineChart({ data }: ActivityLineChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="interactions" stroke="#6366F1" strokeWidth={2} />
          <Line type="monotone" dataKey="posts" stroke="#10B981" strokeWidth={2} />
          <Line type="monotone" dataKey="transactions" stroke="#F59E0B" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
