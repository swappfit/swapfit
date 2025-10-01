"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { day: "Mon", signups: 45 },
  { day: "Tue", signups: 52 },
  { day: "Wed", signups: 38 },
  { day: "Thu", signups: 67 },
  { day: "Fri", signups: 73 },
  { day: "Sat", signups: 89 },
  { day: "Sun", signups: 56 },
]

export function DailySignupsChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="day" 
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8" }}
          />
          <YAxis 
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
            itemStyle={{ color: "#ffffff" }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Line
            type="monotone"
            dataKey="signups"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#059669" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}