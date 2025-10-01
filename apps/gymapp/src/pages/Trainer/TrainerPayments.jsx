// src/pages/Payments.jsx 
import { useState } from "react";

export default function TrainerPayments() {
  // ✅ Static mock data only
  const [payments] = useState([
    { id: 1, client: "Sarah Johnson", plan: "Premium", amount: 120, date: "2024-08-20", status: "paid", method: "Card", transactionId: "txn_sj_928374" },
    { id: 2, client: "Mike Chen", plan: "Basic", amount: 60, date: "2024-08-18", status: "paid", method: "PayPal", transactionId: "txn_mc_882211" },
    { id: 3, client: "Lisa Wong", plan: "Premium", amount: 120, date: "2024-08-15", status: "paid", method: "Card", transactionId: "txn_lw_773322" },
    { id: 4, client: "Alex Rivera", plan: "Elite", amount: 200, date: "2024-08-10", status: "pending", method: "Bank Transfer", transactionId: "txn_ar_123456" },
    { id: 5, client: "Emma Thompson", plan: "Premium", amount: 120, date: "2024-08-05", status: "paid", method: "Card", transactionId: "txn_et_445566" },
    { id: 6, client: "David Kim", plan: "Basic", amount: 60, date: "2024-07-28", status: "failed", method: "Card", transactionId: "txn_dk_778899" },
    { id: 7, client: "James Wilson", plan: "Elite", amount: 200, date: "2024-08-22", status: "paid", method: "Card", transactionId: "txn_jw_334455" },
    { id: 8, client: "Olivia Brown", plan: "Premium", amount: 120, date: "2024-08-19", status: "paid", method: "PayPal", transactionId: "txn_ob_667788" },
    { id: 9, client: "Daniel Garcia", plan: "Basic", amount: 60, date: "2024-08-12", status: "pending", method: "Bank Transfer", transactionId: "txn_dg_990011" },
    { id: 10, client: "Sophia Martinez", plan: "Premium", amount: 120, date: "2024-08-08", status: "paid", method: "Card", transactionId: "txn_sm_223344" },
  ]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="animate-fade-in p-6 bg-gray-900 min-h-screen text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-gray-400 mt-2">
          View your earnings, payment history, and client transactions
        </p>
      </div>

      {/* Stats (static only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-xl text-center border border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-emerald-400">$540</div>
          <div className="text-sm text-gray-400 mt-1">Paid This Period</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl text-center border border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-yellow-400">$260</div>
          <div className="text-sm text-gray-400 mt-1">Pending</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl text-center border border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-cyan-400">$800</div>
          <div className="text-sm text-gray-400 mt-1">Total Collected</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl text-center border border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-red-400">2</div>
          <div className="text-sm text-gray-400 mt-1">Failed Payments</div>
        </div>
      </div>

      {/* Search & Filter (UI only) */}
      <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <input
              type="text"
              placeholder="Search clients..."
              className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200"
            />
            <select
              className="px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200"
            >
              <option>All Time</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>
          <button className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg">
            Export CSV
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-750 text-gray-300 text-sm">
              <tr>
                <th className="py-4 px-6 font-semibold">Client</th>
                <th className="py-4 px-6 font-semibold">Plan</th>
                <th className="py-4 px-6 font-semibold">Amount</th>
                <th className="py-4 px-6 font-semibold">Date</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold">Method</th>
                <th className="py-4 px-6 font-semibold">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-gray-700 transition-colors duration-150"
                >
                  <td className="py-5 px-6 font-medium text-white">{payment.client}</td>
                  <td className="py-5 px-6 text-gray-300">{payment.plan}</td>
                  <td className="py-5 px-6 font-semibold text-white">${payment.amount}</td>
                  <td className="py-5 px-6 text-gray-400">{formatDate(payment.date)}</td>
                  <td className="py-5 px-6">
                    {payment.status === "paid" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-300 border border-emerald-800/30">
                        Paid
                      </span>
                    )}
                    {payment.status === "pending" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-300 border border-yellow-800/30">
                        Pending
                      </span>
                    )}
                    {payment.status === "failed" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-800/30">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="py-5 px-6 text-gray-300">{payment.method}</td>
                  <td className="py-5 px-6 text-xs text-gray-500 font-mono bg-gray-850 rounded px-2 py-1">
                    {payment.transactionId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-gray-800 rounded-xl border border-gray-700">
        <div className="text-gray-400 text-sm">
          Showing <span className="text-white font-semibold">{payments.length}</span> of{" "}
          <span className="text-white font-semibold">{payments.length}</span> transactions
        </div>
        <div className="text-gray-400 text-sm">
          Data as of: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
