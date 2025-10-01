// src/pages/Gym/GymMembers.jsx
import React, { useState, useEffect } from "react";
import * as gymService from "../../api/gymService";
import { useAuth } from "../../context/AuthContext";

export default function GymMembers() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [gymId, setGymId] = useState(null); // store gym ID for notifications
  const { user } = useAuth();

  const fetchMembers = async () => {
    if (!user) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await gymService.getMyGymMembers();
      // normalize response
      const formattedMembers = (response.data || []).map((sub) => ({
        id: sub.user.id,
        name: sub.user.memberProfile?.name || sub.user.email,
        plan: sub.gymPlan?.name || "Unknown Plan",
        joined: new Date(sub.startDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        status: sub.status === "active" ? "Active" : "Inactive",
        visits: sub.visits || 0,
        lastCheckIn: sub.lastCheckIn || null,
        lastCheckOut: sub.lastCheckOut || null,
        paymentStatus: sub.status === "active" ? "Paid" : "Pending",
      }));
      setMembers(formattedMembers);
      // store gymId from first member (or fetch separately from gym profile)
      if (response.data?.length) setGymId(response.data[0].gymPlan?.gymId);
    } catch (err) {
      console.error("Fetch Members Error:", err);
      setError(err.response?.data?.message || "Error fetching members.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [user]);

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDateTime = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const badgeColor = (status, type = "membership") => {
    if (type === "payment") {
      switch (status) {
        case "Paid":
          return "bg-green-600/20 text-green-400 border border-green-600/40";
        case "Pending":
          return "bg-yellow-600/20 text-yellow-400 border border-yellow-600/40";
        case "Overdue":
          return "bg-red-600/20 text-red-400 border border-red-600/40";
        default:
          return "bg-gray-700 text-gray-300";
      }
    }
    switch (status) {
      case "Active":
        return "bg-green-600/20 text-green-400 border border-green-600/40";
      case "Expiring Soon":
        return "bg-orange-600/20 text-orange-400 border border-orange-600/40";
      default:
        return "bg-gray-700 text-gray-300";
    }
  };

  // --- Notification actions ---
  const handleSendNotificationToAll = async () => {
    if (!gymId) return alert("Gym ID not available.");
    const title = prompt("Enter notification title for all members:");
    if (!title) return;
    const message = prompt("Enter notification message:");
    if (!message) return;
    try {
      const res = await gymService.sendNotificationToGym(gymId, { title, message });
      alert(res.message || "Notification sent to all members.");
    } catch (err) {
      console.error(err);
      alert("Failed to send notification to all members.");
    }
  };

  const handleSendNotificationToMember = async (memberId, memberName) => {
    const title = prompt(`Notification title for ${memberName}:`);
    if (!title) return;
    const message = prompt("Enter notification message:");
    if (!message) return;
    try {
      const res = await gymService.sendNotificationToUser(memberId, { title, message });
      alert(res.message || `Notification sent to ${memberName}`);
    } catch (err) {
      console.error(err);
      alert(`Failed to send notification to ${memberName}.`);
    }
  };

  const handleViewProfile = (member) => alert(`Viewing profile for ${member.name}`);

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in">
      <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Member Management</h1>
          <p className="text-gray-400">
            {isLoading ? "Loading members..." : `You have ${filteredMembers.length} active members`}
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={handleSendNotificationToAll}
            className="bg-teal-600 hover:bg-teal-500 text-white text-sm px-4 py-2 rounded-lg shadow-md transition"
          >
            Notify All Members
          </button>
        </div>
      </div>

      <div className="overflow-x-auto px-6 pb-20">
        {isLoading ? (
          <div className="text-center py-20">
            <p className="text-white">Loading your members...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400">{error}</p>
            <button onClick={fetchMembers} className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg">
              Try Again
            </button>
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 text-gray-300 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Visits</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3">Membership</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, idx) => (
                <tr key={member.id} className={`${idx % 2 === 0 ? "bg-gray-800" : "bg-gray-750"} hover:bg-gray-700 transition`}>
                  <td className="px-4 py-3 text-white font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-teal-400">{member.plan}</td>
                  <td className="px-4 py-3 text-gray-400">{member.joined}</td>
                  <td className="px-4 py-3 text-purple-400">{member.visits}</td>
                  <td className="px-4 py-3 text-gray-300">{formatDateTime(member.lastCheckIn)}</td>
                  <td className="px-4 py-3 text-gray-300">{formatDateTime(member.lastCheckOut)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeColor(member.paymentStatus, "payment")}`}>
                      {member.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button
                      onClick={() => handleViewProfile(member)}
                      className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-3 py-1 rounded-md transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleSendNotificationToMember(member.id, member.name)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded-md transition"
                    >
                      Notify
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-gray-400">
                    No members found for your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
