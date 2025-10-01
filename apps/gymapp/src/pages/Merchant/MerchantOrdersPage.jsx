// src/pages/Merchant/MerchantOrdersPage.jsx
import React, { useState } from 'react';

const MOCK_ORDERS = [
  { id: "#ORD-8815", customer: "Sarah K", date: "Apr 10, 2024", total: 89.98, items: 2, status: "Shipped" },
  { id: "#ORD-8814", customer: "Mark T", date: "Apr 9, 2024", total: 24.99, items: 1, status: "Processing" },
  { id: "#ORD-8813", customer: "Jessica L", date: "Apr 8, 2024", total: 119.97, items: 3, status: "Delivered" },
  { id: "#ORD-8812", customer: "David R", date: "Apr 7, 2024", total: 69.99, items: 1, status: "Cancelled" },
  { id: "#ORD-8811", customer: "Alex M", date: "Apr 6, 2024", total: 45.50, items: 1, status: "Delivered" },
  { id: "#ORD-8810", customer: "Taylor S", date: "Apr 5, 2024", total: 159.99, items: 4, status: "Shipped" },
];

const STATUS_OPTIONS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function MerchantOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = MOCK_ORDERS.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) || order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectOrder = (id) => {
    setSelectedOrders(prev =>
      prev.includes(id)
        ? prev.filter(oid => oid !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk ${action} for orders:`, selectedOrders);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered": return "bg-green-600 text-green-100";
      case "Processing": return "bg-yellow-600 text-yellow-100";
      case "Shipped": return "bg-blue-600 text-blue-100";
      case "Cancelled": return "bg-red-600 text-red-100";
      default: return "bg-gray-600 text-gray-100";
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="bg-transparent p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Order Management</h2>
            <p className="text-gray-300">Track and fulfill customer orders</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-gray-600 hover:bg-gray-500 text-white text-sm px-4 py-2 rounded-lg transition">
              Export CSV
            </button>
            <button className="bg-teal-600 hover:bg-teal-500 text-white text-sm px-4 py-2 rounded-lg transition">
              Print Labels
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search orders or customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-40"
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-900/30 border border-blue-700 p-3 rounded-lg mb-6 flex items-center justify-between">
            <span className="text-blue-200">{selectedOrders.length} orders selected</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('ship')}
                className="bg-teal-600 hover:bg-teal-500 text-white text-sm px-3 py-1 rounded transition"
              >
                Mark as Shipped
              </button>
              <button
                onClick={() => handleBulkAction('cancel')}
                className="bg-red-600 hover:bg-red-500 text-white text-sm px-3 py-1 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="px-6 pb-8">
        <div className="space-y-4">
          {filteredOrders.map((order, i) => (
            <div
              key={i}
              className="bg-gray-800 p-5 rounded-xl shadow-xl border border-gray-700 hover:bg-gray-750 transition group"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => toggleSelectOrder(order.id)}
                    className="mt-2 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <div className="flex items-center gap-4">
                      <h3 className="text-white font-bold">{order.id}</h3>
                      <span className="text-gray-400">• {order.items} item{order.items !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-gray-300 mt-1">Customer: {order.customer}</p>
                    <p className="text-gray-400 text-sm">{order.date}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-2 mt-4 sm:mt-0">
                  <span className="text-xl font-bold text-green-400">${order.total}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <button className="bg-teal-600 hover:bg-teal-500 text-white text-xs py-1.5 px-4 rounded-lg font-medium transition mt-2 sm:mt-0">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No orders found</div>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}