// src/pages/Trainer/TrainerClients.jsx
import React, { useState, useEffect, useCallback } from "react";
import * as trainerService from "../../api/trainerService";
import { useAuth } from "../../context/AuthContext";
import { Star, RefreshCw, AlertTriangle, UserCheck, X, Check } from 'lucide-react'; 

export default function TrainerClients({ onClose }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Function to fetch real client data from the backend
  const fetchClients = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setError("You must be logged in to view clients");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
        const response = await trainerService.getMyClients(); 
        if (response.success && Array.isArray(response.data)) {
            const formattedClients = response.data.map(sub => ({
                id: sub.user.id,
                name: sub.user.memberProfile?.name || sub.user.email.split('@')[0], 
                avatar: (sub.user.memberProfile?.name || sub.user.email).charAt(0).toUpperCase(),
                email: sub.user.email,
                plan: sub.trainerPlan?.name || 'Standard',
                joinDate: new Date(sub.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                status: sub.status,
                attendance: [ 
                    { day: "Mon", value: 1 }, { day: "Tue", value: 0 }, { day: "Wed", value: 1 }, 
                    { day: "Thu", value: 1 }, { day: "Fri", value: 0 }, { day: "Sat", value: 1 }, { day: "Sun", value: 0 }
                ],
                bio: sub.user.memberProfile?.fitnessGoal || 'No goal set.',
                isOnline: Math.random() > 0.5,
            }));
            setClients(formattedClients);
        } else {
            setClients([]);
            setError(response?.message || "No clients found.");
        }
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to load clients. Please check your network.');
        console.error("Fetch Clients Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchClients();
    }
  }, [isAuthenticated, fetchClients]);

  // Handle close action
  const handleClose = () => {
    if (isRefreshing) {
      return;
    }
    
    if (onClose) {
      onClose();
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshing(true);
    setShowRefreshSuccess(false);
    
    try {
      await fetchClients();
      setShowRefreshSuccess(true);
      
      setTimeout(() => {
        setShowRefreshSuccess(false);
        setRefreshing(false);
        setIsRefreshing(false);
      }, 2000);
    } catch (error) {
      console.error("Error refreshing clients:", error);
      setRefreshing(false);
      setIsRefreshing(false);
    }
  };

  // Attendance Chart Component
  const AttendanceChart = ({ data = [] }) => {
    const totalDays = data.length;
    const attendedDays = data.filter(d => d.value > 0).length;
    const percentage = totalDays > 0 ? Math.round((attendedDays / totalDays) * 100) : 0;

    const values = data.map((d) => d.value);
    const max = Math.max(...values, 1);

    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-300">Weekly Attendance</h4>
          <span className="text-sm font-bold text-teal-400">{percentage}%</span>
        </div>
        <div className="w-full flex items-end justify-center gap-3 mt-2" style={{ minHeight: 100 }}>
          {data.map((d, i) => {
            const height = (d.value / max) * 80;
            const color = d.value > 0 ? "#0d9488" : "#374151";
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="rounded-t-md"
                  style={{
                    width: 24,
                    height: `${height}px`,
                    background: color,
                  }}
                />
                <div className="text-xs text-gray-300">{d.day}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Filtered Clients
  const filteredClients =
    statusFilter === "all"
      ? clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : clients.filter((client) => client.status === statusFilter && client.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Fallback for ActivityIndicator
  const CustomActivityIndicator = () => (
    <div className="flex justify-center items-center">
      <svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );

  // Handle authentication state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          You need to be logged in to view your clients. Please log in to continue.
        </p>
        <button 
          onClick={() => window.location.href = '/login'} 
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      {/* Header with Close Button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-gray-400 mt-2">
            {isLoading ? "Loading clients..." : `Manage, track, and grow your ${filteredClients.length} client relationships`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showRefreshSuccess && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-600 rounded-lg">
              <Check size={16} className="text-white" />
              <span className="text-white text-sm">Data refreshed</span>
            </div>
          )}
          <button
            onClick={handleClose}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            title="Close"
            disabled={isRefreshing}
          >
            <X size={24} className={`${isRefreshing ? "text-gray-600" : "text-gray-400"}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 p-4 bg-gray-800 rounded-xl border border-gray-700 flex gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium ${
            statusFilter === "all"
              ? "bg-teal-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          disabled={isRefreshing}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter("active")}
          className={`px-4 py-2 rounded-lg font-medium ${
            statusFilter === "active"
              ? "bg-green-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          disabled={isRefreshing}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter("inactive")}
          className={`px-4 py-2 rounded-lg font-medium ${
            statusFilter === "inactive"
              ? "bg-red-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          disabled={isRefreshing}
        >
          Inactive
        </button>
         <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ml-auto"
            disabled={isRefreshing}
          />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Loading and Error States */}
        {isLoading ? (
            <div className="lg:col-span-3 text-center py-20">
                <CustomActivityIndicator />
                <p className="text-gray-400 mt-3">Loading clients...</p>
            </div>
        ) : error ? (
            <div className="lg:col-span-3 text-center py-20">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={fetchClients} className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg" disabled={isRefreshing}>Try Again</button>
            </div>
        ) : filteredClients.length === 0 ? (
             <div className="lg:col-span-3 text-center py-20">
                <UserCheck className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No clients found for this filter.</p>
             </div>
        ) : (
             <>
               {/* Clients List */}
               <div className="lg:col-span-2 space-y-6">
                 {filteredClients.map((client) => (
                   <div
                     key={client.id}
                     className={`bg-gray-800 p-6 rounded-xl shadow-xl border ${
                       selectedClient?.id === client.id
                         ? "border-teal-500"
                         : "border-gray-700"
                     } hover:bg-gray-750 transition`}
                   >
                     <div className="flex items-start gap-4">
                       <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                         {client.avatar}
                       </div>
                       <div className="flex-1">
                         <h3 className="font-bold text-lg">{client.name}</h3>
                         <p className="text-sm text-gray-300">{client.email}</p>
                         <div className="flex items-center gap-4 mt-1">
                           <p className="text-xs text-gray-400">
                             Plan: {client.plan} • Joined{" "}
                             {client.joinDate}
                           </p>
                           <span
                             className={`px-2 py-1 rounded-full text-xs font-medium ${
                               client.status === "active"
                                 ? "bg-green-600 text-green-100"
                                 : "bg-red-600 text-red-100"
                             }`}
                           >
                             {client.status}
                           </span>
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>

               {/* Analytics + Actions */}
               <div className="space-y-6">
                 {/* Analytics */}
                 <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
                   <h3 className="text-xl font-bold mb-4">Client Analytics</h3>
                   {selectedClient ? (
                     <>
                       <div className="flex items-center gap-4 mb-6">
                         <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                           {selectedClient.avatar}
                         </div>
                         <div>
                           <div className="font-bold">{selectedClient.name}</div>
                           <div className="text-sm text-gray-300">
                             {selectedClient.email}
                           </div>
                         </div>
                       </div>
                       <AttendanceChart data={selectedClient.attendance} />
                     </>
                   ) : (
                     <p className="text-gray-400">Select a client to view analytics</p>
                   )}
                 </div>

                 {/* Quick Actions */}
                 <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
                   <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                   <div className="space-y-3">
                     <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isRefreshing}>
                       <Star size={16} />
                       Schedule Session
                     </button>
                     <button 
                       onClick={handleRefresh}
                       disabled={refreshing || isRefreshing}
                       className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {refreshing || isRefreshing ? (
                         <>
                           <svg className="animate-spin h-4 w-4 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           <span className="ml-2 text-white">Refreshing...</span>
                         </>
                       ) : (
                         <>
                           <RefreshCw size={16} />
                           <span>Refresh Data</span>
                         </>
                       )}
                     </button>
                   </div>
                 </div>
               </div>
             </>
        )}
      </div>
    </div>
  );
}