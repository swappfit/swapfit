import { useState } from 'react';

// 🎨 Recharts for beautiful bar chart
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ✅ MOCK DATA
const MOCK_DASHBOARD_DATA = {
  recentClients: [
    { name: "Sarah K", lastSession: "Yesterday", goalAchieved: 90 },
    { name: "Mark T", lastSession: "Mon, Fri", goalAchieved: 65 },
    { name: "Jessica L", lastSession: "Today", goalAchieved: 78 },
  ],
  upcomingSessions: [
    { clientName: "Sarah K", time: "11:00 AM", type: "Personal Training" },
    { clientName: "Mark T", time: "1:30 PM", type: "Yoga & Mobility" },
    { clientName: "Jessica L", time: "4:00 PM", type: "HIIT Workout" },
  ],
  tasksAndReminders: [
    { description: "Review Sarah’s progress report", dueDate: "Today" },
    { description: "Schedule monthly check-in with Mark", dueDate: "Tomorrow" },
    { description: "Update workout plan for Jessica", dueDate: "Friday" },
  ],
  clientProgress: [
    { name: 'Week 1', progress: 65 },
    { name: 'Week 2', progress: 72 },
    { name: 'Week 3', progress: 85 },
    { name: 'Week 4', progress: 90 },
  ],
};

export default function Dashboard() {
  const [dashboardData] = useState(MOCK_DASHBOARD_DATA);

  // 🕒 Live Date/Time
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // ✅ TOP STATS
  const topStats = [
    { label: 'Active Sessions Today', value: dashboardData.upcomingSessions.length, color: 'bg-teal-500' },
    { label: 'Pending Messages', value: '2', color: 'bg-emerald-500' },
    { label: 'Action Required', value: '1', color: 'bg-amber-500' },
  ];

  const getInitials = (name) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase();

  return (
    <div className="w-full animate-fade-in">
      <main className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-transparent p-6 rounded-xl border-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Welcome back, Coach!
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                {formattedDate}, {formattedTime}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {topStats.map((stat, i) => (
                <div
                  key={i}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${stat.color} shadow-md hover:scale-105 transition-transform duration-200`}
                >
                  {stat.value} {stat.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: My Clients */}
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">My Clients</h3>
              <div className="space-y-4">
                {dashboardData.recentClients.map((client, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-700 p-4 rounded-lg hover:bg-gray-650 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg">{client.name}</p>
                        <p className="text-gray-300 text-sm">Last: {client.lastSession}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-20 bg-gray-600 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-teal-400 to-teal-600 h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${client.goalAchieved}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-white min-w-[40px] text-right">
                          {client.goalAchieved}%
                        </span>
                      </div>
                      <button className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md">
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Chart */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Overall Client Progress</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.clientProgress} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="progress" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Upcoming Sessions</h3>
              <div className="space-y-4">
                {dashboardData.upcomingSessions.map((session, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-700 p-4 rounded-lg hover:bg-gray-650 transition-all duration-200"
                  >
                    <div>
                      <p className="font-semibold text-white text-lg">{session.clientName}</p>
                      <p className="text-gray-300 text-sm">
                        {session.time} • {session.type}
                      </p>
                    </div>
                    <button className="ml-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white text-sm px-4 py-2 rounded-lg font-medium hover:scale-105 transition-all duration-200 shadow-md whitespace-nowrap">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Tasks & Reminders</h3>
              <ul className="space-y-3">
                {dashboardData.tasksAndReminders.map((task, i) => (
                  <li
                    key={i}
                    className="flex items-start p-3 bg-gray-700 rounded-lg hover:bg-gray-650 transition-all duration-200"
                  >
                    <div className="mt-1 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-white font-medium">{task.description}</p>
                      <p className="text-gray-400 text-sm mt-1">Due: {task.dueDate}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
