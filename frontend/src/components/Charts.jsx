import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const AXIS_COLOR = "#647092";
const GRID_COLOR = "#1A2740";

const TooltipStyle = {
  contentStyle: {
    backgroundColor: "#131E30",
    border: "1px solid #233350",
    borderRadius: 8,
    fontSize: 12,
    color: "#F3F6FB",
  },
  labelStyle: { color: "#AEBBD4" },
};

export function EmptyChartState({ label = "No data available" }) {
  return (
    <div className="h-full min-h-[220px] flex items-center justify-center text-sm text-mist-500">
      {label}
    </div>
  );
}

export function SifDistributionDonut({ data }) {
  if (!data || data.length === 0) return <EmptyChartState />;

  const COLORS = { "SIF Potential": "#E5484D", "Non-SIF": "#33B27A" };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={92}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[entry.name] || "#4C7CF0"} />
          ))}
        </Pie>
        <Tooltip {...TooltipStyle} />
        <Legend
          verticalAlign="bottom"
          height={28}
          formatter={(value) => <span className="text-mist-300 text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Horizontal grouped bar chart: total reports vs SIF reports per category.
 * data: [{ name, total, sif, sif_density }]
 */
export function RankedBarChart({ data, height = 280, barColor = "#E5484D" }) {
  if (!data || data.length === 0) return <EmptyChartState />;

  const chartData = [...data].sort((a, b) => a.total - b.total);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
        <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "#AEBBD4", fontSize: 12 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
          width={130}
        />
        <Tooltip {...TooltipStyle} />
        <Legend formatter={(value) => <span className="text-mist-300 text-xs">{value}</span>} />
        <Bar dataKey="total" name="Total Reports" fill="#243452" radius={[0, 4, 4, 0]} barSize={12} />
        <Bar dataKey="sif" name="SIF Potential" fill={barColor} radius={[0, 4, 4, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({ data, dataKey = "sif_reports", height = 280, barColor = "#4C7CF0", nameKey = "name" }) {
  if (!data || data.length === 0) return <EmptyChartState />;

  const chartData = [...data].sort((a, b) => a[dataKey] - b[dataKey]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
        <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
        <YAxis
          type="category"
          dataKey={nameKey}
          tick={{ fill: "#AEBBD4", fontSize: 12 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
          width={130}
        />
        <Tooltip {...TooltipStyle} />
        <Bar dataKey={dataKey} fill={barColor} radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
