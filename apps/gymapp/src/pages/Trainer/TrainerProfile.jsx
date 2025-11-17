// src/pages/Trainer/TrainerProfile.jsx
import React, { useState, useEffect } from 'react';
// ✅ FIX: Import the CORRECT trainer service to call the trainer-specific endpoint
import { getMyProfile } from '../../api/trainerService'; 
import { useAuth } from '../../context/AuthContext';
import { Edit, CheckCircle, Mail, Phone, AlertCircle } from 'lucide-react'; 

export default function TrainerProfile() {
  const [trainerData, setTrainerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { user, formatUserId } = useAuth();

  const fetchTrainerProfile = async () => {
    if (!user || !user.id) {
        setIsLoading(false);
        setError("User not logged in or ID not found. Please re-login.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        // Format the user ID to ensure it's 25 characters
        const formattedUserId = formatUserId(user.id);
        console.log('Formatted user ID:', formattedUserId);
        
        // Call the TRAINER service to get the trainer profile
        const profileResponse = await getMyProfile();
        
        // The new API returns { success: true, data: <trainerProfile> }
        // So we extract the `data` property directly.
        const profileData = profileResponse.data;

        // Check if the trainer profile exists
        if (!profileData) {
            throw new Error("Trainer profile not found. Please complete your profile first.");
        }

        // Set the trainer data directly
        setTrainerData(profileData);
    } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load profile.';
        setError(errorMessage);
        console.error('Fetch Profile Error:', err);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'TRAINER') {
        fetchTrainerProfile();
    } else {
        setIsLoading(false);
        setError("This page is for trainers only.");
    }
  }, [user]);
  
  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto text-center py-20">
        <p className="text-gray-400 mt-4">Loading Trainer Profile...</p>
      </div>
    );
  }

  if (error && !trainerData) {
    return (
      <div className="w-full max-w-5xl mx-auto text-center py-20">
        <AlertCircle size={32} className="text-red-500 mx-auto" />
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchTrainerProfile} className="bg-teal-600 text-white px-4 py-2 rounded-lg">Try Again</button>
      </div>
    );
  }

  // Use trainerData directly
  const trainer = trainerData;

  return (
    <div className="w-full animate-fade-in max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Coach Profile</h1>
        <button
          onClick={() => setShowEditModal(true)}
          className="bg-teal-600 hover:bg-teal-500 text-white py-2 px-5 rounded-lg font-medium transition transform hover:scale-105 shadow-md"
        >
          <Edit size={16} className="inline-block mr-2" />
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Profile Card */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
          <div className="flex flex-col items-center mb-6">
            <img
              src={trainer.gallery?.[0] || "https://via.placeholder.com/120/4ade80/FFFFFF?text=TR"}
              alt={trainer.name || "Trainer"}
              className="w-32 h-32 rounded-full object-cover border-4 border-teal-500 mb-4"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src="https://via.placeholder.com/120/4ade80/FFFFFF?text=TR";
              }}
            />
            <h2 className="text-xl font-bold text-white">{trainer.name || "Trainer"}</h2>
            <p className="text-gray-400 text-sm">{trainer.experience ? `${trainer.experience} Years` : "Experience"}</p>
          </div>

          {/* Specialties */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {(trainer.specialties || ["Personal Training", "Group Fitness"]).map((spec, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-700 text-teal-300 rounded-lg text-sm font-medium"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Certifications</h3>
            <div className="space-y-2">
              {(trainer.certifications || ["Certified Trainer"]).map((cert, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle size={16} className="text-green-400" />
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Contact & Bio */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Email</label>
                <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg px-4 py-3">
                  <Mail size={16} className="text-teal-500 mr-3" />
                  <input type="email" value={user.email || 'trainer@example.com'} className="flex-1 bg-transparent text-white focus:outline-none" readOnly />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Phone</label>
                <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg px-4 py-3">
                  <Phone size={16} className="text-teal-500 mr-3" />
                  <input type="tel" value={trainer.phone || 'N/A'} className="flex-1 bg-transparent text-white focus:outline-none" readOnly />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                <label className="block text-gray-400 text-sm">Payment Methods</label>
                <span className="px-4 py-2 rounded-lg text-sm font-medium transition bg-teal-600 text-white">
                  Enabled
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Bio</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {trainer.bio || "No bio available."}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal (Mock) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto shadow-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <p className="text-gray-400 mb-6">This is a mock modal. In real app, you'd see form fields here.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input type="text" defaultValue={trainer.name || ""} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <textarea rows="4" defaultValue={trainer.bio || ""} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"></textarea>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-3 px-4 rounded-lg font-medium transition">Save Changes</button>
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-medium transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}