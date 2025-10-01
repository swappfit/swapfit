// src/pages/Gym/GymDashboard.jsx 
import React, { useEffect, useState } from 'react';

// Recharts for charts (still needed for rendering)
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ✅ HARD-CODED MOCK DATA — No API, no state
const MOCK_DASHBOARD_DATA = {
  revenueOverview: {
    monthlyRevenue: 28500,
    lastMonthRevenue: 24000,
    growthRate: 18.75,
  },
  checkInsToday: 42,
  totalMembers: 128,
  upcomingRenewals: [
    { name: 'Sarah K', dueDate: 'Tomorrow', amount: 99 },
    { name: 'Mark T', dueDate: 'Friday', amount: 149 },
    { name: 'Jessica L', dueDate: 'Next Week', amount: 99 },
  ],
  recentClients: [
    { name: 'Sarah K', lastSession: 'Yesterday', goalAchieved: 90 },
    { name: 'Mark T', lastSession: 'Mon, Fri', goalAchieved: 65 },
    { name: 'Jessica L', lastSession: 'Today', goalAchieved: 78 },
  ],
  clientProgress: [
    { name: 'Week 1', progress: 65 },
    { name: 'Week 2', progress: 72 },
    { name: 'Week 3', progress: 85 },
    { name: 'Week 4', progress: 90 },
  ],
  upcomingSessions: [
    { clientName: 'Sarah K', time: '11:00 AM', type: 'Personal Training' },
    { clientName: 'Mark T', time: '1:30 PM', type: 'Yoga & Mobility' },
    { clientName: 'Jessica L', time: '4:00 PM', type: 'HIIT Workout' },
  ],
};

export default function GymDashboard() {
  // ✅ Hardcoded user for UI preview
  const user = { email: "owner@flexfit.com" };

  // ✅ Real date/time state
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = currentDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // ✅ Helper: Get initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="w-full animate-fade-in">
      <main className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-transparent p-6 rounded-xl border-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Welcome back, {user?.email?.split('@')[0] || 'Owner'}!
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                {formattedDate}, {formattedTime}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-500 shadow-md hover:scale-105 transition-transform duration-200">
                {MOCK_DASHBOARD_DATA.checkInsToday} Check-ins Today
              </div>
              <div className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-500 shadow-md hover:scale-105 transition-transform duration-200">
                {MOCK_DASHBOARD_DATA.totalMembers} Members
              </div>
            </div>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Overview */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-2">Monthly Revenue</h3>
            <p className="text-2xl font-bold text-green-400">
              ${MOCK_DASHBOARD_DATA.revenueOverview.monthlyRevenue}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              +{MOCK_DASHBOARD_DATA.revenueOverview.growthRate}% vs last month
            </p>
          </div>

          {/* Check-ins Today */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-2">Check-ins Today</h3>
            <p className="text-2xl font-bold text-blue-400">
              {MOCK_DASHBOARD_DATA.checkInsToday}
            </p>
            <p className="text-sm text-gray-400 mt-1">Active members today</p>
          </div>

          {/* Total Members */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-2">Total Members</h3>
            <p className="text-2xl font-bold text-purple-400">
              {MOCK_DASHBOARD_DATA.totalMembers}
            </p>
            <p className="text-sm text-gray-400 mt-1">Current active subscriptions</p>
          </div>

          {/* Upcoming Renewals */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-2">Upcoming Renewals</h3>
            <p className="text-2xl font-bold text-orange-400">
              {MOCK_DASHBOARD_DATA.upcomingRenewals.length}
            </p>
            <p className="text-sm text-gray-400 mt-1">Due soon</p>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Recent Clients & Progress Chart */}
          <div className="space-y-6">
            {/* My Clients */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Recent Clients</h3>
              <div className="space-y-4">
                {MOCK_DASHBOARD_DATA.recentClients.map((client, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-700 p-4 rounded-lg hover:bg-gray-650 transition-all duration-200"
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
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-white min-w-[40px] text-right">
                          {client.goalAchieved}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Progress Chart */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Client Progress</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={MOCK_DASHBOARD_DATA.clientProgress}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
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
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                      }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar
                      dataKey="progress"
                      fill="#0d9488"
                      radius={[4, 4, 0, 0]}
                      className="hover:fill-teal-400 transition-colors duration-300"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Upcoming Renewals & Sessions */}
          <div className="space-y-6">
            {/* Upcoming Renewals */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Upcoming Renewals</h3>
              <ul className="space-y-3">
                {MOCK_DASHBOARD_DATA.upcomingRenewals.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-650 transition-all duration-200"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-gray-400 text-sm">Due: {item.dueDate}</p>
                    </div>
                    <span className="text-teal-400 font-bold">${item.amount}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Upcoming Sessions</h3>
              <div className="space-y-4">
                {MOCK_DASHBOARD_DATA.upcomingSessions.map((session, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-700 p-4 rounded-lg hover:bg-gray-650 transition-all duration-200"
                  >
                    <div>
                      <p className="font-semibold text-white">{session.clientName}</p>
                      <p className="text-gray-300 text-sm">{session.time} • {session.type}</p>
                    </div>
                    <button className="bg-teal-600 hover:bg-teal-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md">
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}