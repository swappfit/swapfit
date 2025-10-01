// src/pages/Merchant/MerchantAnalyticsPage.jsx
import React, { useState, useEffect } from 'react';

// Simple number animation hook
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

export default function MerchantAnalyticsPage() {
  const totalSales = useAnimatedNumber(8420);
  const totalOrders = useAnimatedNumber(342);
  const conversionRate = useAnimatedNumber(3.2, 3000);
  const avgOrderValue = useAnimatedNumber(24.62, 2500);

  const salesData = [
    { month: 'Jan', sales: 5200 },
    { month: 'Feb', sales: 6100 },
    { month: 'Mar', sales: 7300 },
    { month: 'Apr', sales: 8420 },
    { month: 'May', sales: 9100 },
    { month: 'Jun', sales: 8900 },
  ];

  const topCategories = [
    { name: 'Supplements', revenue: 48200, color: 'bg-teal-500' },
    { name: 'Equipment', revenue: 24500, color: 'bg-blue-500' },
    { name: 'Accessories', revenue: 12800, color: 'bg-purple-500' },
    { name: 'Apparel', revenue: 8900, color: 'bg-pink-500' },
  ];

  return (
    <div className="w-full animate-fade-in">
      <div className="bg-transparent p-6">
        <h2 className="text-2xl font-bold text-white">Sales Analytics</h2>
        <p className="text-gray-300 mt-1">Track performance, trends, and forecasts</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 px-6 mb-8">
        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300">Total Sales</h3>
          <p className="text-2xl font-bold text-teal-400 mt-1">${totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300">Total Orders</h3>
          <p className="text-2xl font-bold text-blue-400 mt-1">{totalOrders.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300">Conversion Rate</h3>
          <p className="text-2xl font-bold text-purple-400 mt-1">{conversionRate}%</p>
        </div>
        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300">Avg. Order Value</h3>
          <p className="text-2xl font-bold text-orange-400 mt-1">${avgOrderValue}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6 mb-8">
        {/* Sales Trend Chart */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Sales Trend (Last 6 Months)</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {salesData.map((item, i) => {
              const max = Math.max(...salesData.map(d => d.sales));
              const height = (item.sales / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div
                    className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg transition-all duration-1000 ease-out hover:from-teal-500 hover:to-teal-300"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="mt-2 text-gray-300 text-xs text-center">{item.month}</div>
                  <div className="opacity-0 group-hover:opacity-100 text-teal-400 text-xs transition-opacity">
                    ${item.sales.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Revenue by Category</h3>
          <div className="space-y-4">
            {topCategories.map((cat, i) => {
              const total = topCategories.reduce((sum, c) => sum + c.revenue, 0);
              const percentage = (cat.revenue / total) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-white text-sm">{cat.name}</span>
                    <span className="text-gray-300 text-sm">${cat.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${cat.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forecast & Insights */}
      <div className="px-6">
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700 p-6 rounded-xl">
          <h3 className="text-xl font-bold text-white mb-2">📈 Next Month Forecast</h3>
          <p className="text-purple-200 mb-4">Based on current trends, expect <span className="text-green-400 font-bold">+12% growth</span> in June.</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-purple-600/20 px-3 py-2 rounded-lg">
              <span className="text-purple-300">Top Seller:</span> <span className="text-white">Whey Protein</span>
            </div>
            <div className="bg-purple-600/20 px-3 py-2 rounded-lg">
              <span className="text-purple-300">Opportunity:</span> <span className="text-white">Bundle Accessories</span>
            </div>
            <div className="bg-purple-600/20 px-3 py-2 rounded-lg">
              <span className="text-purple-300">Alert:</span> <span className="text-orange-300">Low Stock on Yoga Mats</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}