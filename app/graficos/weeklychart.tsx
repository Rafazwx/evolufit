"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Zap } from "lucide-react";

interface Post {
  userId: string;
  createdAt: any;
}

interface WeeklyChartProps {
  posts: Post[];
  userId: string;
}

export default function WeeklyChart({ posts, userId }: WeeklyChartProps) {
  // Lógica de processar os dados (Tiramos isso do arquivo principal!)
  const getWeeklyData = () => {
    const data = [];
    const today = new Date();
    
    // Pega os últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      
      // Conta quantos treinos o usuário fez naquele dia
      const count = posts.filter(post => {
        if (post.userId !== userId || !post.createdAt) return false;
        const postDate = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
        return postDate.getDate() === d.getDate() && postDate.getMonth() === d.getMonth();
      }).length;

      data.push({
        day: d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3).toUpperCase(),
        treinos: count,
        fullDate: d.toLocaleDateString('pt-BR'),
      });
    }
    return data;
  };

  const data = getWeeklyData();
  const totalTreinos = data.reduce((acc, item) => acc + item.treinos, 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <div className="bg-green-500/20 p-1.5 rounded-lg">
                <Zap size={16} className="text-green-500" fill="currentColor" />
            </div>
            <h3 className="text-sm font-bold text-white">Frequência Semanal</h3>
        </div>
        <span className="text-xs font-bold text-zinc-500">{totalTreinos} treinos</span>
      </div>

      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
                dataKey="day" 
                tick={{ fill: '#71717a', fontSize: 10 }} 
                axisLine={false} 
                tickLine={false} 
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#22c55e', fontSize: '12px', fontWeight: 'bold' }}
                cursor={{ fill: '#27272a', opacity: 0.4 }}
            />
            <Bar dataKey="treinos" radius={[4, 4, 4, 4]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.treinos > 0 ? '#22c55e' : '#27272a'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}