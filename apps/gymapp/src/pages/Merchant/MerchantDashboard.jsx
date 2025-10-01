// src/pages/Merchant/MerchantDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock Data
const MOCK_DATA = {
  stats: {
    totalSales: 8420,
    activeProducts: 24,
    newProducts: 8,
    pendingOrders: 7,
    storeRating: 4.7,
    totalReviews: 128,
  },
  salesTrend: [
    { month: 'Jan', sales: 5200 },
    { month: 'Feb', sales: 6100 },
    { month: 'Mar', sales: 7300 },
    { month: 'Apr', sales: 8420 },
    { month: 'May', sales: 9100 },
    { month: 'Jun', sales: 8900 },
  ],
  revenueByCategory: [
    { name: 'Supplements', revenue: 48200, color: 'bg-teal-500' },
    { name: 'Equipment', revenue: 24500, color: 'bg-blue-500' },
    { name: 'Accessories', revenue: 12800, color: 'bg-purple-500' },
    { name: 'Apparel', revenue: 8900, color: 'bg-pink-500' },
  ],
  topProducts: [
    { id: 1, name: "Whey Protein (Chocolate)", sales: 89, revenue: 2225, image: "https://via.placeholder.com/60/4ade80/FFFFFF?text=WP" },
    { id: 2, name: "Resistance Bands Set", sales: 64, revenue: 1280, image: "https://via.placeholder.com/60/fbbf24/FFFFFF?text=RB" },
    { id: 3, name: "Yoga Mat (Eco)", sales: 42, revenue: 840, image: "https://via.placeholder.com/60/60a5fa/FFFFFF?text=YM" },
    { id: 4, name: "Pre-Workout (Fruit Punch)", sales: 31, revenue: 1240, image: "https://via.placeholder.com/60/f87171/FFFFFF?text=PW" },
  ],
  recentOrders: [
    { id: "#ORD-8815", customer: "Sarah K", total: 89.98, status: "Delivered", date: "Today, 10:22 AM" },
    { id: "#ORD-8814", customer: "Mark T", total: 24.99, status: "Processing", date: "Today, 9:15 AM" },
    { id: "#ORD-8813", customer: "Jessica L", total: 149.97, status: "Shipped", date: "Yesterday" },
  ],
  lowStock: [
    { name: "Resistance Bands (Heavy)", stock: 3, threshold: 10 },
    { name: "Protein Shaker Bottles", stock: 5, threshold: 15 },
  ],
  liveActivity: [
    { type: "sale", message: "Just sold Whey Protein to Sarah K (New York)", time: "2 min ago" },
    { type: "review", message: "Jessica L left a 5-star review", time: "15 min ago" },
    { type: "restock", message: "Low stock alert: Resistance Bands", time: "1 hour ago" },
  ],
};

// Simple number animation hook (for stats)
const useAnimatedNumber = (target, duration = 2000) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16); // ~60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return value;
};

// Quick Add Modal
const QuickAddModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleAction = (action) => {
    console.log(`Quick Add Action: ${action}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button
            onClick={() => handleAction('addProduct')}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 px-4 rounded-lg font-medium transition text-left"
          >
            Add New Product
          </button>
          <button
            onClick={() => handleAction('createFlashSale')}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 px-4 rounded-lg font-medium transition text-left"
          >
            Create Flash Sale
          </button>
          <button
            onClick={() => handleAction('sendBroadcast')}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 px-4 rounded-lg font-medium transition text-left"
          >
            Send Broadcast
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg font-medium transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default function MerchantDashboard() {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const animatedTotalSales = useAnimatedNumber(MOCK_DATA.stats.totalSales);
  const animatedAvgOrderValue = useAnimatedNumber(24.62, 2500);
  const animatedConversionRate = useAnimatedNumber(3.2, 3000);

  return (
    <div className="w-full animate-fade-in pb-28">
      {/* Professional Welcome Header */}
      <div className="bg-transparent p-6">
        <h2 className="text-2xl font-bold text-white">Welcome back, FlexiFit Team</h2>
        <p className="text-gray-300 mt-1">
          You have <span className="font-medium text-orange-400">{MOCK_DATA.stats.pendingOrders} pending orders</span> and <span className="font-medium text-amber-400">{MOCK_DATA.lowStock.length} low-stock items</span>.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 px-6 mb-8">
        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-gray-300">Total Sales</h3>
            <span className="text-xs text-teal-400">▲12%</span>
          </div>
          <p className="text-2xl font-bold text-teal-400 mt-1">${animatedTotalSales.toLocaleString()}</p>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-gray-300">Active Products</h3>
            <span className="text-xs text-blue-400">+{MOCK_DATA.stats.newProducts}</span>
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-1">{MOCK_DATA.stats.activeProducts}</p>
          <p className="text-xs text-gray-500 mt-1">+{MOCK_DATA.stats.newProducts} this month</p>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition">
          <h3 className="text-sm font-medium text-gray-300">Pending Orders</h3>
          <p className="text-2xl font-bold text-orange-400 mt-1">{MOCK_DATA.stats.pendingOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Need fulfillment</p>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition">
          <h3 className="text-sm font-medium text-gray-300">Store Rating</h3>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-2xl font-bold text-yellow-400">{MOCK_DATA.stats.storeRating}</span>
            <span className="text-yellow-400">⭐</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">from {MOCK_DATA.stats.totalReviews} reviews</p>
        </div>
      </div>

      {/* SALES STATISTICS SECTION */}
      <div className="px-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Sales Statistics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300">Avg. Order Value</h3>
            <p className="text-2xl font-bold text-purple-400 mt-1">${animatedAvgOrderValue}</p>
          </div>
          <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300">Conversion Rate</h3>
            <p className="text-2xl font-bold text-orange-400 mt-1">{animatedConversionRate}%</p>
          </div>
          <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300">Forecast (Next Month)</h3>
            <p className="text-2xl font-bold text-green-400 mt-1">▲12%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ✅ FIXED: Sales Trend Chart — Now using Recharts */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Sales Trend (Last 6 Months)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MOCK_DATA.salesTrend}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="month" stroke="#999" />
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
                    dataKey="sales"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                    className="hover:fill-teal-400 transition-colors duration-300"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by Category */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Revenue by Category</h3>
            <div className="space-y-4">
              {MOCK_DATA.revenueByCategory.map((cat, i) => {
                const total = MOCK_DATA.revenueByCategory.reduce((sum, c) => sum + c.revenue, 0);
                const percentage = (cat.revenue / total) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-white text-sm font-medium">{cat.name}</span>
                      <span className="text-gray-300 text-sm">${cat.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cat.color} transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6 mb-8">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Top Selling Products */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Top Selling Products</h3>
              <button className="text-teal-400 text-sm font-medium hover:underline">View All</button>
            </div>
            <div className="flex space-x-4 pb-2 overflow-x-auto scrollbar-hide">
              {MOCK_DATA.topProducts.map((product, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-40 bg-gray-700 p-4 rounded-xl hover:bg-gray-650 transition cursor-pointer group"
                >
                  <div className="flex justify-center mb-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-14 h-14 object-contain rounded"
                    />
                  </div>
                  <h4 className="text-white font-medium text-xs mb-1 text-center line-clamp-2">
                    {product.name}
                  </h4>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">{product.sales} sold</p>
                    <p className="text-teal-400 font-bold text-sm">${product.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alert */}
          {MOCK_DATA.lowStock.length > 0 && (
            <div className="bg-amber-900/20 border border-amber-700 p-5 rounded-xl">
              <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                ⚠️ Low Stock Alert
              </h3>
              <ul className="space-y-2">
                {MOCK_DATA.lowStock.map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-amber-200">
                    <span className="text-sm">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-amber-600 px-2 py-1 rounded-full">
                        {item.stock} left
                      </span>
                      <button className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded transition">
                        Restock
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Recent Orders */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {MOCK_DATA.recentOrders.map((order, i) => (
                <div
                  key={i}
                  className="p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition group cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white text-sm">{order.id}</p>
                      <p className="text-gray-400 text-xs">{order.customer}</p>
                      <p className="text-gray-500 text-xs mt-1">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">${order.total}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                          order.status === "Delivered"
                            ? "bg-green-600 text-green-100"
                            : order.status === "Processing"
                            ? "bg-yellow-600 text-yellow-100"
                            : "bg-blue-600 text-blue-100"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Activity Feed</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {MOCK_DATA.liveActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                  <div
                    className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      item.type === "sale"
                        ? "bg-teal-400"
                        : item.type === "review"
                        ? "bg-yellow-400"
                        : "bg-blue-400"
                    }`}
                  ></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{item.message}</p>
                    <p className="text-gray-500 text-xs mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowQuickAdd(true)}
          className="bg-teal-600 hover:bg-teal-500 text-white p-4 rounded-full shadow-lg transition transform hover:scale-105 flex items-center justify-center w-14 h-14 focus:outline-none focus:ring-2 focus:ring-teal-400"
          aria-label="Quick Add"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-400">Quick Add</p>
        </div>
      </div>

      <QuickAddModal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
    </div>
  );
}