"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_CHART_DATA = [
  { name: 'Mon', deliveries: 120 },
  { name: 'Tue', deliveries: 150 },
  { name: 'Wed', deliveries: 180 },
  { name: 'Thu', deliveries: 140 },
  { name: 'Fri', deliveries: 210 },
  { name: 'Sat', deliveries: 250 },
  { name: 'Sun', deliveries: 90 },
];

export default function AdminChart() {
  return (
    <div className="h-80 w-full relative z-10">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={MOCK_CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            cursor={{ fill: '#334155', opacity: 0.4 }}
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              border: '1px solid #1e293b',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'
            }}
            itemStyle={{ color: '#c7d2fe' }}
          />
          <Bar 
            dataKey="deliveries" 
            fill="#6366f1" 
            radius={[6, 6, 0, 0]}
            barSize={40}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
