import React from 'react';
import { StateSummary, InsightType } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface Props {
  selectedStates: StateSummary[];
  activeTab: InsightType;
}

const COLORS = ['#818cf8', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#22d3ee'];

const ComparisonChart: React.FC<Props> = ({ selectedStates, activeTab }) => {
  const monthsSet = new Set<string>();
  selectedStates.forEach(s => s.monthlyTrends.forEach(t => monthsSet.add(t.month)));
  const sortedMonths = Array.from(monthsSet).sort();

  const chartData = sortedMonths.map(month => {
    const entry: any = { month };
    selectedStates.forEach(s => {
      const trend = s.monthlyTrends.find(t => t.month === month);
      entry[s.state] = trend ? trend.total : 0;
    });
    return entry;
  });

  const formatMonth = (monthKey: string) => {
    if (!monthKey || monthKey === 'UNKNOWN') return 'NA';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: '2-digit' }).toUpperCase();
  };

  return (
    <div className="h-[400px] w-full">
      <div className="mb-10 flex justify-between items-center">
        <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Audit Flow Benchmarking (Consolidated)</h5>
        <div className="flex gap-2">
           <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
           <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Live Engine</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonth}
            tick={{ fontSize: 9, fontVariant: 'tabular-nums', fontWeight: 900, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 9, fontWeight: 700, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', fontSize: '11px', fontWeight: 900, color: '#f8fafc' }}
            labelFormatter={formatMonth}
            itemStyle={{ padding: '4px 0', color: '#fff' }}
            cursor={{ stroke: '#1e293b', strokeWidth: 1 }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '30px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}
            iconType="circle"
          />
          {selectedStates.map((s, idx) => (
            <Line 
              key={s.state}
              type="monotone" 
              dataKey={s.state} 
              stroke={COLORS[idx % COLORS.length]} 
              strokeWidth={5}
              dot={{ r: 5, strokeWidth: 3, fill: '#020617' }}
              activeDot={{ r: 8, strokeWidth: 0, fill: COLORS[idx % COLORS.length] }}
              animationDuration={1500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;