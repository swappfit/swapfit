// src/pages/Gym/GymPayments.jsx
import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Mock Data
const MOCK_PAYMENTS = [
  { id: 1, member: "Sarah K", date: "2024-04-10", amount: 99, method: "Credit Card", status: "Paid" },
  { id: 2, member: "Mark T", date: "2024-04-08", amount: 49, method: "Cash", status: "Paid" },
  { id: 3, member: "Jessica L", date: "2024-04-05", amount: 149, method: "PayPal", status: "Refunded" },
  { id: 4, member: "David R", date: "2024-04-01", amount: 199, method: "Credit Card", status: "Paid" },
  { id: 5, member: "Alex M", date: "2024-03-28", amount: 99, method: "UPI", status: "Paid" },
  { id: 6, member: "Taylor S", date: "2024-03-25", amount: 199, method: "Credit Card", status: "Pending" },
  { id: 7, member: "Jordan P", date: "2024-03-20", amount: 49, method: "Cash", status: "Paid" },
  { id: 8, member: "Casey L", date: "2024-03-15", amount: 99, method: "Apple Pay", status: "Paid" },
  { id: 9, member: "Riley K", date: "2024-03-10", amount: 149, method: "Credit Card", status: "Paid" },
  { id: 10, member: "Morgan T", date: "2024-03-05", amount: 199, method: "PayPal", status: "Paid" },
];

const PENDING_DUES = [
  { member: "Taylor S", plan: "Premium Monthly", dueDate: "Apr 25, 2024", amount: 199 },
  { member: "Chris L", plan: "Basic Monthly", dueDate: "Apr 28, 2024", amount: 49 },
  { member: "Morgan K", plan: "Annual Plan", dueDate: "May 1, 2024", amount: 999 },
];

const INCOME_TREND = [
  { month: 'Nov', income: 8900, members: 89 },
  { month: 'Dec', income: 9700, members: 97 },
  { month: 'Jan', income: 10500, members: 105 },
  { month: 'Feb', income: 11200, members: 112 },
  { month: 'Mar', income: 11800, members: 118 },
  { month: 'Apr', income: 12800, members: 128 },
];

const PAYMENT_METHODS = [
  { name: 'Credit Card', value: 58, fill: '#0d9488' },
  { name: 'Cash', value: 22, fill: '#f59e0b' },
  { name: 'PayPal', value: 12, fill: '#3b82f6' },
  { name: 'UPI/Apple Pay', value: 8, fill: '#8b5cf6' },
];

const MEMBER_TRENDS = {
  monthlyGrowth: "+12%",
  churnRate: 3.2,
  retentionRate: 92,
  totalMembers: 128,
  activeMembers: 118,
  newThisMonth: 15,
};

export default function GymPayments() {
  const [activeTab, setActiveTab] = useState('payments');
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedPayments, setSelectedPayments] = useState([]);

  const filteredPayments = MOCK_PAYMENTS.filter(payment => {
    if (dateRange === 'last30days') return true;
    if (dateRange === 'thisMonth') return payment.date.startsWith('2024-04');
    if (dateRange === 'lastMonth') return payment.date.startsWith('2024-03');
    return true;
  });

  const totalIncome = filteredPayments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = PENDING_DUES.reduce((sum, p) => sum + p.amount, 0);

  const toggleSelectPayment = (id) => {
    setSelectedPayments(prev =>
      prev.includes(id)
        ? prev.filter(pid => pid !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk ${action} for payments:`, selectedPayments);
  };

  return (
    <div className="w-full animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-transparent p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Payment Analytics</h1>
            <p className="text-gray-300">Track income, pending dues, and member trends</p>
          </div>
          <div className="flex gap-3">
            {selectedPayments.length > 0 && (
              <button
                onClick={() => handleBulkAction('export')}
                className="bg-gray-600 hover:bg-gray-500 text-white text-sm px-4 py-2 rounded-lg transition"
              >
                Export Selected
              </button>
            )}
            <button className="bg-gray-600 hover:bg-gray-500 text-white text-sm px-4 py-2 rounded-lg transition">
              Export All
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-40"
            >
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <div className="flex space-x-8">
            {[
              { key: 'payments', label: 'Payment History' },
              { key: 'pending', label: 'Pending Dues' },
              { key: 'trends', label: 'Member Trends' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 font-medium text-sm border-b-2 transition ${
                  activeTab === tab.key
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 pb-8">
        {activeTab === 'payments' && (
          <>
            {/* Income Summary */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Income Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">${totalIncome.toLocaleString()}</div>
                  <div className="text-gray-400 text-sm mt-1">Total Income</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">{filteredPayments.filter(p => p.status === 'Paid').length}</div>
                  <div className="text-gray-400 text-sm mt-1">Paid Transactions</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-400">{filteredPayments.filter(p => p.status === 'Refunded').length}</div>
                  <div className="text-gray-400 text-sm mt-1">Refunds</div>
                </div>
              </div>
            </div>

            {/* Payment Method Distribution */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Payment Method Distribution</h2>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PAYMENT_METHODS}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {PAYMENT_METHODS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Records */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Payment Records</h2>
              {selectedPayments.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-700 p-3 rounded-lg mb-4 flex items-center justify-between">
                  <span className="text-blue-200">{selectedPayments.length} payments selected</span>
                  <button
                    onClick={() => handleBulkAction('export')}
                    className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-3 py-1 rounded transition"
                  >
                    Export
                  </button>
                </div>
              )}
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-gray-700 p-5 rounded-lg hover:bg-gray-650 transition group"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedPayments.includes(payment.id)}
                          onChange={() => toggleSelectPayment(payment.id)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold">
                          {payment.member.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{payment.member}</h3>
                          <p className="text-gray-400 text-sm">{payment.date} • {payment.method}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <span className={`text-xl font-bold ${
                          payment.status === "Paid" ? "text-green-400" : "text-red-400"
                        }`}>
                          ${payment.amount}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          payment.status === "Paid" ? "bg-green-600 text-green-100" :
                          payment.status === "Refunded" ? "bg-red-600 text-red-100" :
                          "bg-yellow-600 text-yellow-100"
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'pending' && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Pending Dues</h2>
            <p className="text-gray-300 mb-6">
              Members with upcoming or overdue payments. Total pending: <span className="text-orange-400 font-bold">${pendingAmount.toLocaleString()}</span>
            </p>
            <div className="space-y-4">
              {PENDING_DUES.map((due, i) => (
                <div
                  key={i}
                  className="bg-gray-700 p-5 rounded-lg hover:bg-gray-650 transition group flex flex-col sm:flex-row justify-between items-start sm:items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {due.member.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{due.member}</h3>
                        <p className="text-gray-400 text-sm">{due.plan}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 mt-4 sm:mt-0">
                    <span className="text-xl font-bold text-orange-400">${due.amount}</span>
                    <span className="text-gray-400 text-sm">Due: {due.dueDate}</span>
                    <button className="bg-teal-600 hover:bg-teal-500 text-white text-xs py-1.5 px-4 rounded-lg font-medium transition mt-2 sm:mt-0">
                      Send Reminder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Member Trends Summary */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Member Trends Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">{MEMBER_TRENDS.totalMembers}</div>
                  <div className="text-gray-400 text-xs mt-1">Total Members</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">{MEMBER_TRENDS.activeMembers}</div>
                  <div className="text-gray-400 text-xs mt-1">Active Members</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-teal-400">+{MEMBER_TRENDS.newThisMonth}</div>
                  <div className="text-gray-400 text-xs mt-1">New This Month</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">{MEMBER_TRENDS.monthlyGrowth}</div>
                  <div className="text-gray-400 text-xs mt-1">Growth Rate</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-400">{MEMBER_TRENDS.retentionRate}%</div>
                  <div className="text-gray-400 text-xs mt-1">Retention Rate</div>
                </div>
              </div>
            </div>

            {/* Income & Member Growth — Area Chart */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Income & Member Growth</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={INCOME_TREND}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="month" stroke="#999" />
                    <YAxis yAxisId="left" stroke="#999" label={{ value: 'Income ($)', angle: -90, position: 'insideLeft', fill: '#999' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#999" label={{ value: 'Members', angle: 90, position: 'insideRight', fill: '#999' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#0d9488"
                      fill="#0d9488"
                      fillOpacity={0.3}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="members"
                      name="Members"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Retention & Churn — Radial Bar */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Retention & Churn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-bold text-green-400 mb-4">Retention Rate</h3>
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        barSize={10}
                        data={[{ name: 'Retention', uv: MEMBER_TRENDS.retentionRate }]}
                      >
                        <RadialBar
                          minAngle={0}
                          maxAngle={360}
                          dataKey="uv"
                          cornerRadius={10}
                          fill="#0d9488"
                          background
                        />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-white">
                          {MEMBER_TRENDS.retentionRate}%
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-bold text-red-400 mb-4">Churn Rate</h3>
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        barSize={10}
                        data={[{ name: 'Churn', uv: MEMBER_TRENDS.churnRate }]}
                      >
                        <RadialBar
                          minAngle={0}
                          maxAngle={360}
                          dataKey="uv"
                          cornerRadius={10}
                          fill="#ef4444"
                          background
                        />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-white">
                          {MEMBER_TRENDS.churnRate}%
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}