"use client";

import React from 'react';
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export const InteractionTrendChart = React.memo(function InteractionTrendChart({ data }: { data: any[] }) {
  const chartData = [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => ({
      date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      Bids: d.bidsCount || 0,
      Repairs: d.repairsCount || 0,
    }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="bidsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="repairsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          />
          <Tooltip 
            contentStyle={{ 
              background: 'var(--background/95)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border)', 
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <Area 
            type="monotone" 
            dataKey="Bids" 
            stroke="var(--primary)" 
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#bidsGradient)"
            dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background)' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Area 
            type="monotone" 
            dataKey="Repairs" 
            stroke="#4ade80" 
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#repairsGradient)"
            dot={{ r: 4, fill: '#4ade80', strokeWidth: 2, stroke: 'var(--background)' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
