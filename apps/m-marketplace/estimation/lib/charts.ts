import type { ComponentType } from 'react';
import * as Recharts from 'recharts';

// Recharts 2's class declarations lose their React base type when pnpm's
// virtual store is outside the repository. Keep the runtime library intact
// and expose its chart primitives through the application's React boundary.
const chart = (component: unknown): ComponentType<any> =>
  component as ComponentType<any>;

export const PieChart = chart(Recharts.PieChart);
export const Pie = chart(Recharts.Pie);
export const Cell = chart(Recharts.Cell);
export const BarChart = chart(Recharts.BarChart);
export const Bar = chart(Recharts.Bar);
export const LineChart = chart(Recharts.LineChart);
export const Line = chart(Recharts.Line);
export const XAxis = chart(Recharts.XAxis);
export const YAxis = chart(Recharts.YAxis);
export const CartesianGrid = chart(Recharts.CartesianGrid);
export const Tooltip = chart(Recharts.Tooltip);
export const ResponsiveContainer = chart(Recharts.ResponsiveContainer);
export const Legend = chart(Recharts.Legend);
